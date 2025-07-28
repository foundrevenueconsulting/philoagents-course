"""
MongoDB repository for multi-way conversation persistence
"""
from datetime import datetime
from typing import List, Optional
import logging

from philoagents.config import settings
from philoagents.infrastructure.mongo.client import MongoClientWrapper
from philoagents.domain.multi_way.conversation_persistence import (
    PersistedConversation,
    ConversationSummary,
    ConversationListFilter,
    ConversationMetadata
)
from philoagents.domain.multi_way.dialogue_state import DialogueState
from philoagents.domain.multi_way.conversation_config import ConversationConfig

logger = logging.getLogger(__name__)


class MultiWayConversationRepository:
    """
    Repository for persisting and retrieving multi-way conversations
    """
    
    def __init__(self):
        self.mongo_wrapper = MongoClientWrapper(
            model=PersistedConversation,
            collection_name=settings.MONGO_MULTI_WAY_CONVERSATIONS_COLLECTION
        )
    
    def save_conversation(
        self,
        session_id: str,
        user_id: str,
        dialogue_state: DialogueState,
        config: ConversationConfig,
        metadata: Optional[ConversationMetadata] = None
    ) -> PersistedConversation:
        """
        Save or update a conversation in MongoDB
        """
        try:
            # Try to find existing conversation (ensuring user owns it)
            existing = self.get_conversation_by_session_id(session_id, user_id)
            
            if existing:
                # Verify user ownership
                if existing.user_id != user_id:
                    raise ValueError(f"User {user_id} does not own conversation {session_id}")
                
                # Update existing conversation
                existing.dialogue_state = dialogue_state
                existing.update_stats()
                
                # Update in MongoDB
                self.mongo_wrapper.collection.update_one(
                    {"session_id": session_id, "user_id": user_id},
                    {"$set": existing.model_dump(exclude={"id"})}
                )
                
                logger.info(f"Updated conversation {session_id} for user {user_id}")
                return existing
            else:
                # Create new conversation
                if not metadata:
                    metadata = ConversationMetadata(
                        title=dialogue_state.topic or f"{config.name} Discussion",
                        participant_count=len(config.agents),
                        participant_names=[agent.name for agent in config.agents],
                        config_id=config.id,
                        config_name=config.name
                    )
                
                conversation = PersistedConversation(
                    session_id=session_id,
                    user_id=user_id,
                    metadata=metadata,
                    dialogue_state=dialogue_state
                )
                conversation.update_stats()
                
                # Insert into MongoDB
                result = self.mongo_wrapper.collection.insert_one(
                    conversation.model_dump(exclude={"id"})
                )
                conversation.id = str(result.inserted_id)
                
                logger.info(f"Created new conversation {session_id} for user {user_id}")
                return conversation
                
        except Exception as e:
            logger.error(f"Failed to save conversation {session_id}: {e}")
            raise
    
    def get_conversation_by_session_id(self, session_id: str, user_id: str) -> Optional[PersistedConversation]:
        """
        Retrieve a conversation by session ID (user-filtered for security)
        """
        try:
            documents = self.mongo_wrapper.fetch_documents(
                limit=1,
                query={"session_id": session_id, "user_id": user_id}
            )
            return documents[0] if documents else None
        except Exception as e:
            logger.error(f"Failed to get conversation {session_id} for user {user_id}: {e}")
            return None
    
    def get_conversation_by_id(self, conversation_id: str, user_id: str) -> Optional[PersistedConversation]:
        """
        Retrieve a conversation by MongoDB document ID (user-filtered for security)
        """
        try:
            from bson import ObjectId
            documents = self.mongo_wrapper.fetch_documents(
                limit=1,
                query={"_id": ObjectId(conversation_id), "user_id": user_id}
            )
            return documents[0] if documents else None
        except Exception as e:
            logger.error(f"Failed to get conversation by ID {conversation_id} for user {user_id}: {e}")
            return None
    
    def list_conversations(
        self,
        filter_params: ConversationListFilter
    ) -> List[ConversationSummary]:
        """
        List conversations with filtering and pagination
        """
        try:
            # Build MongoDB query - always filter by user_id for security
            query = {"user_id": filter_params.user_id}
            if filter_params.config_id:
                query["metadata.config_id"] = filter_params.config_id
            if filter_params.status:
                query["dialogue_state.status"] = filter_params.status.value
            
            # Build sort parameter
            sort_direction = 1 if filter_params.sort_order == "asc" else -1
            sort_params = [(filter_params.sort_by, sort_direction)]
            
            # Query MongoDB directly for better control
            cursor = self.mongo_wrapper.collection.find(query).sort(sort_params)
            cursor = cursor.skip(filter_params.offset).limit(filter_params.limit)
            
            documents = list(cursor)
            
            # Convert to PersistedConversation objects, then to summaries
            conversations = []
            for doc in documents:
                # Convert ObjectId to string
                if "_id" in doc:
                    doc["id"] = str(doc.pop("_id"))
                
                try:
                    conversation = PersistedConversation.model_validate(doc)
                    conversations.append(conversation.to_summary())
                except Exception as e:
                    logger.warning(f"Failed to parse conversation document: {e}")
                    continue
            
            logger.info(f"Retrieved {len(conversations)} conversations for user {filter_params.user_id}")
            return conversations
            
        except Exception as e:
            logger.error(f"Failed to list conversations: {e}")
            return []
    
    def delete_conversation(self, session_id: str, user_id: str) -> bool:
        """
        Delete a conversation by session ID (user-filtered for security)
        """
        try:
            result = self.mongo_wrapper.collection.delete_one({"session_id": session_id, "user_id": user_id})
            success = result.deleted_count > 0
            
            if success:
                logger.info(f"Deleted conversation {session_id} for user {user_id}")
            else:
                logger.warning(f"Conversation {session_id} not found for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete conversation {session_id} for user {user_id}: {e}")
            return False
    
    def get_conversation_count(self, user_id: str, config_id: Optional[str] = None) -> int:
        """
        Get total count of conversations for a user, optionally filtered by config
        """
        try:
            query = {"user_id": user_id}
            if config_id:
                query["metadata.config_id"] = config_id
            
            return self.mongo_wrapper.collection.count_documents(query)
            
        except Exception as e:
            logger.error(f"Failed to count conversations for user {user_id}: {e}")
            return 0
    
    def close(self):
        """Close the MongoDB connection"""
        self.mongo_wrapper.close()