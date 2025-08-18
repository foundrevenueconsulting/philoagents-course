from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from opik.integrations.langchain import OpikTracer
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from philoagents.application.conversation_service.generate_response import (
    get_response,
    get_streaming_response,
)
from philoagents.application.conversation_service.reset_conversation import (
    reset_conversation_state,
)
from philoagents.application.multi_way_conversation.conversation_orchestrator import (
    ConversationOrchestrator,
)
from philoagents.domain.philosopher_factory import PhilosopherFactory
from philoagents.config import settings
from philoagents.infrastructure.clerk_auth import (
    get_current_user,
    get_current_user_from_query_or_header,
    get_current_user_if_enforced,
    User,
)
from philoagents.application.image_recognition_service import ImageRecognitionService

from .opik_utils import configure

configure()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the API."""
    # Startup code (if any) goes here
    yield
    # Shutdown code goes here
    opik_tracer = OpikTracer()
    opik_tracer.flush()


app = FastAPI(lifespan=lifespan, root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
conversation_orchestrator = ConversationOrchestrator()
image_recognition_service = ImageRecognitionService()


class ChatMessage(BaseModel):
    message: str
    philosopher_id: str
    user_id: Optional[str] = None


class ResetMemoryRequest(BaseModel):
    user_id: Optional[str] = None


# Multi-way conversation models
class StartConversationRequest(BaseModel):
    config_id: str
    session_id: Optional[str] = None


class ConversationMessageRequest(BaseModel):
    session_id: str
    message: str


class ConversationResponse(BaseModel):
    session_id: str
    status: str
    message: Optional[str] = None
    dialogue_state: Optional[dict] = None


# Image recognition models
class SubmitAnswerRequest(BaseModel):
    item_id: str
    selected_option_id: str
    response_time_ms: int
    session_id: Optional[str] = None
    confidence_level: Optional[int] = Field(None, ge=1, le=5)


# Multi-way conversation endpoints
@app.get("/multi-way/configurations")
async def get_configurations():
    """Get all available conversation configurations"""
    try:
        configs = conversation_orchestrator.get_available_configurations()
        return {
            "configurations": {
                config_id: {
                    "id": config.id,
                    "name": config.name,
                    "description": config.description,
                    "format": config.format.value,
                    "agents": [
                        {
                            "id": agent.id,
                            "name": agent.name,
                            "role": agent.role.value,
                            "domain_expertise": agent.domain_expertise,
                            "primary_color": agent.primary_color,
                            "secondary_color": agent.secondary_color,
                        }
                        for agent in config.agents
                    ],
                    "max_rounds": config.max_rounds,
                    "allow_human_feedback": config.allow_human_feedback,
                }
                for config_id, config in configs.items()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/multi-way/start")
async def start_conversation(
    request: StartConversationRequest, current_user: User = Depends(get_current_user)
):
    """Start a new multi-way conversation (requires authentication)"""
    try:
        session_id, dialogue_state = await conversation_orchestrator.start_conversation(
            config_id=request.config_id,
            user_id=current_user.id,
            session_id=request.session_id,
        )

        return ConversationResponse(
            session_id=session_id,
            status=dialogue_state.status.value,
            message="Conversation started. Please provide a topic to discuss.",
            dialogue_state=dialogue_state.dict(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/multi-way/message")
async def send_message(
    request: ConversationMessageRequest, current_user: User = Depends(get_current_user)
):
    """Send a message to the multi-way conversation (requires authentication)"""
    try:
        # Verify user ownership before processing message
        existing_state = conversation_orchestrator.active_sessions.get(
            request.session_id
        )
        if existing_state:
            # Check if user owns this session
            session_user = conversation_orchestrator.session_users.get(
                request.session_id
            )
            if session_user != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You don't own this conversation",
                )

        dialogue_state = await conversation_orchestrator.process_user_message(
            session_id=request.session_id, message=request.message
        )

        return ConversationResponse(
            session_id=request.session_id,
            status=dialogue_state.status.value,
            message="Message processed successfully",
            dialogue_state=dialogue_state.dict(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/multi-way/{session_id}/stream")
async def stream_conversation(
    session_id: str,
    token: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_query_or_header),
):
    """Stream the next agent response in the conversation (requires authentication)"""
    try:
        # Verify user ownership
        session_user = conversation_orchestrator.session_users.get(session_id)
        if session_user != current_user.id:
            raise HTTPException(
                status_code=403, detail="Access denied: You don't own this conversation"
            )

        async def generate_stream():
            try:
                async for event in conversation_orchestrator.generate_next_response(
                    session_id
                ):
                    if event["type"] == "error":
                        yield f"event: error\ndata: {event['message']}\n\n"
                    elif event["type"] == "speaker_info":
                        yield f"event: speaker\ndata: {event['agent_name']} ({event['agent_role']})\n\n"
                    elif event["type"] == "agent_response":
                        # Stream the response content
                        yield f"event: response_start\ndata: {event['agent_name']}\n\n"

                        # Simulate streaming chunks (in real implementation, you might want actual streaming)
                        content = event["content"]
                        chunk_size = 20
                        for i in range(0, len(content), chunk_size):
                            chunk = content[i : i + chunk_size]
                            yield f"event: chunk\ndata: {chunk}\n\n"

                        yield "event: response_end\ndata: complete\n\n"
                    elif event["type"] == "user_input_requested":
                        yield f"event: user_input\ndata: {'; '.join(event['questions'])}\n\n"
                    elif event["type"] == "turn_complete":
                        next_speaker = event.get("next_speaker_id", "")
                        yield f"event: turn_complete\ndata: {next_speaker}\n\n"
                    elif event["type"] == "system":
                        yield f"event: system\ndata: {event['message']}\n\n"

                yield "event: done\ndata: stream_complete\n\n"

            except Exception as e:
                yield f"event: error\ndata: {str(e)}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/multi-way/{session_id}")
async def get_conversation_state(
    session_id: str, current_user: User = Depends(get_current_user)
):
    """Get current conversation state (requires authentication)"""
    try:
        # Verify user ownership
        session_user = conversation_orchestrator.session_users.get(session_id)
        if session_user and session_user != current_user.id:
            raise HTTPException(
                status_code=403, detail="Access denied: You don't own this conversation"
            )

        dialogue_state = conversation_orchestrator.get_conversation_state(session_id)
        if not dialogue_state:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"session_id": session_id, "dialogue_state": dialogue_state.dict()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/multi-way/{session_id}/history")
async def get_conversation_history(session_id: str, limit: Optional[int] = None):
    """Get conversation history"""
    try:
        messages = conversation_orchestrator.get_conversation_history(session_id, limit)
        return {"session_id": session_id, "messages": [msg.dict() for msg in messages]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/multi-way/{session_id}")
async def end_conversation(session_id: str):
    """End a multi-way conversation"""
    try:
        dialogue_state = await conversation_orchestrator.end_conversation(session_id)
        if not dialogue_state:
            raise HTTPException(status_code=404, detail="Session not found")

        return ConversationResponse(
            session_id=session_id,
            status=dialogue_state.status.value,
            message="Conversation ended successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/multi-way/{session_id}/summary")
async def get_conversation_summary(session_id: str):
    """Get conversation summary from all agents' perspectives"""
    try:
        summaries = await conversation_orchestrator.get_conversation_summary(session_id)
        return {"session_id": session_id, "summaries": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/test-conversations")
async def list_conversations(
    config_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
):
    """List multi-way conversations with filtering and pagination (requires authentication)"""
    try:
        from philoagents.domain.multi_way.conversation_persistence import (
            ConversationListFilter,
        )
        from philoagents.domain.multi_way.dialogue_state import ConversationStatus

        # Parse status if provided
        parsed_status = None
        if status:
            try:
                parsed_status = ConversationStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

        filter_params = ConversationListFilter(
            user_id=current_user.id,  # Always filter by authenticated user
            config_id=config_id,
            status=parsed_status,
            limit=min(limit, 100),  # Cap at 100
            offset=max(offset, 0),  # No negative offsets
            sort_by=sort_by,
            sort_order=sort_order,
        )

        conversations = await conversation_orchestrator.list_conversations(
            filter_params
        )

        return {
            "conversations": [conv.model_dump() for conv in conversations],
            "filter": filter_params.model_dump(),
            "count": len(conversations),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/multi-way/load/{session_id}")
async def load_conversation(
    session_id: str, current_user: User = Depends(get_current_user)
):
    """Load a conversation from database (requires authentication)"""
    try:
        # Try to load from database (user-filtered)
        dialogue_state = await conversation_orchestrator.load_conversation(
            session_id, current_user.id
        )

        if not dialogue_state:
            raise HTTPException(
                status_code=404, detail=f"Conversation {session_id} not found"
            )

        # Get the full persisted conversation for metadata (user-filtered)
        persisted = await conversation_orchestrator.get_persisted_conversation(
            session_id, current_user.id
        )

        return {
            "session_id": session_id,
            "dialogue_state": dialogue_state.model_dump(),
            "metadata": persisted.metadata.model_dump() if persisted else None,
            "status": "loaded",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Debug endpoints for authentication
@app.get("/debug/auth-config")
async def debug_auth_config():
    """Debug endpoint to check authentication configuration"""
    from philoagents.infrastructure.clerk_auth import authenticator
    
    return {
        "enforce_authentication": settings.ENFORCE_AUTHENTICATION,
        "clerk_enabled": authenticator.clerk_enabled,
        "clerk_secret_key_set": bool(settings.CLERK_SECRET_KEY),
        "clerk_secret_key_length": len(settings.CLERK_SECRET_KEY) if settings.CLERK_SECRET_KEY else 0,
        "jwt_secret_key_set": bool(authenticator.jwt_secret_key),
        "jwt_algorithm": authenticator.jwt_algorithm,
        "clerk_client_available": authenticator.clerk_client is not None
    }


@app.get("/debug/auth-test")
async def debug_auth_test(current_user: User = Depends(get_current_user)):
    """Debug endpoint that requires authentication to test token flow"""
    return {
        "success": True,
        "user_id": current_user.id,
        "user_email": current_user.email,
        "message": "Authentication successful"
    }


# Image Recognition Practice endpoints
@app.get("/image-recognition/config")
async def get_recognition_config():
    """Get the current recognition configuration (public endpoint)"""
    try:
        from philoagents.config.recognition_config import get_active_config
        
        config = get_active_config()
        return {
            "type": config.type.value,
            "title": config.title,
            "description": config.description,
            "options": [
                {
                    "id": opt.id,
                    "label": opt.label,
                    "description": opt.description
                }
                for opt in config.options
            ],
            "categories": config.categories,
            "difficulties": config.difficulties
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/random")
async def get_random_question(
    exclude_item_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_if_enforced)
):
    """Get a random image recognition question (authentication controlled by ENFORCE_AUTHENTICATION)"""
    try:
        question = await image_recognition_service.get_random_question(exclude_item_id=exclude_item_id)
        return question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/{item_id}")
async def get_question_by_id(
    item_id: str, 
    current_user: Optional[User] = Depends(get_current_user_if_enforced)
):
    """Get a specific image recognition question by ID (authentication controlled by ENFORCE_AUTHENTICATION)"""
    try:
        question = await image_recognition_service.get_question_by_id(item_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/image-recognition/submit")
async def submit_answer(
    request: SubmitAnswerRequest, current_user: User = Depends(get_current_user)
):
    """Submit an answer to an image recognition question (requires authentication)"""
    try:
        result = await image_recognition_service.submit_answer(
            user_id=current_user.id,
            item_id=request.item_id,
            selected_option_id=request.selected_option_id,
            response_time_ms=request.response_time_ms,
            session_id=request.session_id,
            confidence_level=request.confidence_level,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/stats/{user_id}")
async def get_user_stats(
    user_id: str, 
    current_user: Optional[User] = Depends(get_current_user_if_enforced)
):
    """Get user performance statistics (authentication controlled by ENFORCE_AUTHENTICATION)"""
    try:
        # If authentication is enforced, validate user access
        if current_user and user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        stats = await image_recognition_service.get_user_stats(user_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/history/{user_id}")
async def get_user_history(
    user_id: str,
    limit: int = 20,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
):
    """Get user response history (requires authentication)"""
    try:
        # Users can only access their own history
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        history = await image_recognition_service.get_user_history(
            user_id, limit=min(limit, 100), skip=max(skip, 0)
        )
        return {"history": history, "count": len(history)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/global-stats")
async def get_global_stats():
    """Get global performance statistics (public endpoint)"""
    try:
        stats = await image_recognition_service.get_global_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image-recognition/export-training-data")
async def export_training_data(
    limit: int = 1000, skip: int = 0, current_user: User = Depends(get_current_user)
):
    """Export training data for AI model development (admin only)"""
    try:
        # In a real application, you'd check for admin privileges here
        # For now, any authenticated user can export training data
        training_data = await image_recognition_service.export_training_data(
            limit=min(limit, 5000), skip=max(skip, 0)
        )
        return {"training_data": training_data, "count": len(training_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Original single-philosopher endpoints
@app.post("/chat")
async def chat(chat_message: ChatMessage):
    try:
        philosopher_factory = PhilosopherFactory()
        philosopher = philosopher_factory.get_philosopher(chat_message.philosopher_id)

        response, _ = await get_response(
            messages=chat_message.message,
            philosopher_id=chat_message.philosopher_id,
            philosopher_name=philosopher.name,
            philosopher_perspective=philosopher.perspective,
            philosopher_style=philosopher.style,
            philosopher_context="",
            biotype_id=philosopher.biotype_id,
            health_advice=philosopher.health_advice,
            dietary_recommendations=philosopher.dietary_recommendations,
            emotional_patterns=philosopher.emotional_patterns,
            spiritual_practices=philosopher.spiritual_practices,
            life_purpose_patterns=philosopher.life_purpose_patterns,
            user_id=chat_message.user_id,
        )
        return {
            "response": response,
            "philosopher_id": chat_message.philosopher_id,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        opik_tracer = OpikTracer()
        opik_tracer.flush()

        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            if "message" not in data or "philosopher_id" not in data:
                await websocket.send_json(
                    {
                        "error": "Invalid message format. Required fields: 'message' and 'philosopher_id'"
                    }
                )
                continue

            try:
                philosopher_factory = PhilosopherFactory()
                philosopher = philosopher_factory.get_philosopher(
                    data["philosopher_id"]
                )

                # Use streaming response instead of get_response
                response_stream = get_streaming_response(
                    messages=data["message"],
                    philosopher_id=data["philosopher_id"],
                    philosopher_name=philosopher.name,
                    philosopher_perspective=philosopher.perspective,
                    philosopher_style=philosopher.style,
                    philosopher_context="",
                    biotype_id=philosopher.biotype_id,
                    health_advice=philosopher.health_advice,
                    dietary_recommendations=philosopher.dietary_recommendations,
                    emotional_patterns=philosopher.emotional_patterns,
                    spiritual_practices=philosopher.spiritual_practices,
                    life_purpose_patterns=philosopher.life_purpose_patterns,
                )

                # Send initial message to indicate streaming has started
                await websocket.send_json({"streaming": True})

                # Stream each chunk of the response
                full_response = ""
                async for chunk in response_stream:
                    full_response += chunk
                    await websocket.send_json({"chunk": chunk})

                await websocket.send_json(
                    {"response": full_response, "streaming": False}
                )

            except Exception as e:
                opik_tracer = OpikTracer()
                opik_tracer.flush()

                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        pass


@app.post("/chat/stream")
async def chat_stream(chat_message: ChatMessage):
    """Stream chat responses using Server-Sent Events for Vercel compatibility."""
    try:
        philosopher_factory = PhilosopherFactory()
        philosopher = philosopher_factory.get_philosopher(chat_message.philosopher_id)

        async def generate_stream():
            try:
                # Send initial streaming indicator
                yield "event: streaming\ndata: true\n\n"

                # Stream the response chunks
                async for chunk in get_streaming_response(
                    messages=chat_message.message,
                    philosopher_id=chat_message.philosopher_id,
                    philosopher_name=philosopher.name,
                    philosopher_perspective=philosopher.perspective,
                    philosopher_style=philosopher.style,
                    philosopher_context="",
                    biotype_id=philosopher.biotype_id,
                    health_advice=philosopher.health_advice,
                    dietary_recommendations=philosopher.dietary_recommendations,
                    emotional_patterns=philosopher.emotional_patterns,
                    spiritual_practices=philosopher.spiritual_practices,
                    life_purpose_patterns=philosopher.life_purpose_patterns,
                    user_id=chat_message.user_id,
                ):
                    yield f"event: chunk\ndata: {chunk}\n\n"

                # Send completion indicator
                yield "event: streaming\ndata: false\n\n"
                yield "event: complete\ndata: done\n\n"

            except Exception as e:
                yield f"event: error\ndata: {str(e)}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{user_id}")
async def get_user_conversations(
    user_id: str, philosopher_id: Optional[str] = None, limit: int = 50
):
    """Get conversation history for a specific user.

    Args:
        user_id: The user ID to fetch conversations for
        philosopher_id: Optional philosopher ID to filter by
        limit: Maximum number of conversations to return (default 50)

    Returns:
        List of conversation history entries
    """
    try:
        from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver

        # Use LangGraph's checkpointer to properly retrieve conversation history
        async with AsyncMongoDBSaver.from_conn_string(
            conn_string=settings.MONGO_URI,
            db_name=settings.MONGO_DB_NAME,
            checkpoint_collection_name=settings.MONGO_STATE_CHECKPOINT_COLLECTION,
            writes_collection_name=settings.MONGO_STATE_WRITES_COLLECTION,
        ) as checkpointer:
            # Get list of threads for this user
            from pymongo import MongoClient

            client = MongoClient(settings.MONGO_URI)
            db = client[settings.MONGO_DB_NAME]
            checkpoints_collection = db[settings.MONGO_STATE_CHECKPOINT_COLLECTION]

            # Query for user's conversation threads
            query = {"thread_id": {"$regex": f"^{user_id}"}}
            if philosopher_id:
                query["thread_id"] = {"$regex": f"^{user_id}_{philosopher_id}"}

            # Get unique thread_ids
            unique_threads = checkpoints_collection.distinct("thread_id", query)

            conversations = []

            for thread_id in unique_threads[:limit]:
                try:
                    # Extract philosopher_id from thread_id
                    if thread_id.startswith(user_id + "_"):
                        remaining = thread_id[len(user_id) + 1 :]
                        parts = remaining.split("_")
                        extracted_philosopher_id = parts[0] if parts else "unknown"
                    else:
                        parts = thread_id.split("_")
                        extracted_philosopher_id = parts[0] if parts else "unknown"

                    # Skip if filtering by philosopher and this doesn't match
                    if philosopher_id and extracted_philosopher_id != philosopher_id:
                        continue

                    # Use checkpointer to get the latest checkpoint for this thread
                    config = {"configurable": {"thread_id": thread_id}}
                    checkpoint = await checkpointer.aget(config)

                    if checkpoint:
                        # Handle different checkpoint formats
                        if hasattr(checkpoint, "channel_values"):
                            channel_values = checkpoint.channel_values
                        elif (
                            isinstance(checkpoint, dict)
                            and "channel_values" in checkpoint
                        ):
                            channel_values = checkpoint["channel_values"]
                        else:
                            continue

                        messages = (
                            channel_values.get("messages", []) if channel_values else []
                        )

                        if messages:
                            # Find the last human and AI message pair
                            last_human_msg = None
                            last_ai_msg = None

                            # First pass: find the most recent human message
                            for msg in reversed(messages):
                                if hasattr(msg, "type") and msg.type == "human":
                                    last_human_msg = msg.content
                                    break

                            # Second pass: find the most recent AI message with actual content
                            for msg in reversed(messages):
                                if (
                                    hasattr(msg, "type")
                                    and msg.type == "ai"
                                    and msg.content
                                ):
                                    last_ai_msg = msg.content
                                    break

                            if last_human_msg and last_ai_msg:
                                # Get philosopher name
                                philosopher_factory = PhilosopherFactory()
                                try:
                                    philosopher = philosopher_factory.get_philosopher(
                                        extracted_philosopher_id
                                    )
                                    philosopher_name = philosopher.name
                                except Exception:
                                    philosopher_name = extracted_philosopher_id.title()

                                # Get timestamp from checkpoint
                                if isinstance(checkpoint, dict):
                                    timestamp = checkpoint.get(
                                        "ts", datetime.now().isoformat()
                                    )
                                elif hasattr(checkpoint, "checkpoint"):
                                    timestamp = checkpoint.checkpoint.get(
                                        "ts", datetime.now().isoformat()
                                    )
                                else:
                                    timestamp = datetime.now().isoformat()

                                conversation = {
                                    "id": f"{thread_id}_{len(conversations)}",
                                    "user_id": user_id,
                                    "philosopher_id": extracted_philosopher_id,
                                    "philosopher_name": philosopher_name,
                                    "message": last_human_msg,
                                    "response": last_ai_msg,
                                    "timestamp": timestamp,
                                    "thread_id": thread_id,
                                }

                                conversations.append(conversation)

                except Exception:
                    continue

            client.close()
            return conversations

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching conversation history: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/reset-memory")
async def reset_conversation(request: Optional[ResetMemoryRequest] = None):
    """Resets the conversation state. It deletes the two collections needed for keeping LangGraph state in MongoDB.

    Args:
        request: Optional request body containing user_id for targeted reset

    Raises:
        HTTPException: If there is an error resetting the conversation state.
    Returns:
        dict: A dictionary containing the result of the reset operation.
    """
    try:
        user_id = request.user_id if request else None
        result = await reset_conversation_state(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
