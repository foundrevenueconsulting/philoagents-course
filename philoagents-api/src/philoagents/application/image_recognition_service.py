"""
Service layer for image recognition practice functionality.
"""

from typing import Optional, List

from philoagents.data.image_recognition_data import (
    get_random_recognition_item,
    get_recognition_item_by_id,
    ImageRecognitionItem,
)
from philoagents.domain.image_recognition import (
    ImageRecognitionResponse,
    UserImageRecognitionStats,
)
from philoagents.infrastructure.mongo.image_recognition_repository import (
    ImageRecognitionRepository,
)


class ImageRecognitionService:
    """Service for handling image recognition practice operations."""

    def __init__(self):
        self.repository = ImageRecognitionRepository()

    async def get_random_question(self, exclude_item_id: Optional[str] = None) -> dict:
        """Get a random image recognition question, optionally excluding one."""
        item = get_random_recognition_item(exclude_item_id=exclude_item_id)
        return self._format_question_response(item)

    async def get_question_by_id(self, item_id: str) -> Optional[dict]:
        """Get a specific question by ID."""
        item = get_recognition_item_by_id(item_id)
        if item:
            return self._format_question_response(item)
        return None

    def _format_question_response(self, item: ImageRecognitionItem) -> dict:
        """Format an item for API response (without revealing correct answer)."""
        return {
            "id": item.id,
            "image_path": item.image_path,
            "question": item.question,
            "options": [{"id": opt.id, "text": opt.text} for opt in item.options],
            "category": item.category,
            "difficulty": item.difficulty,
        }

    async def submit_answer(
        self,
        user_id: str,
        item_id: str,
        selected_option_id: str,
        response_time_ms: int,
        session_id: Optional[str] = None,
        confidence_level: Optional[int] = None,
    ) -> dict:
        """Submit a user's answer and return the result."""

        # Get the correct answer from the data
        item = get_recognition_item_by_id(item_id)
        if not item:
            raise ValueError(f"Invalid item_id: {item_id}")

        is_correct = selected_option_id == item.correct_option_id

        # Create response record
        response = ImageRecognitionResponse(
            user_id=user_id,
            item_id=item_id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
            response_time_ms=response_time_ms,
            session_id=session_id,
            confidence_level=confidence_level,
        )

        # Save response
        response_id = await self.repository.save_response(response)

        # Update user statistics
        await self._update_user_stats(user_id, response, item.category, item.difficulty)

        # Return result with feedback
        return {
            "response_id": response_id,
            "is_correct": is_correct,
            "correct_answer": item.correct_answer,
            "explanation": f"The correct answer is '{item.correct_answer}'.",
            "response_time_ms": response_time_ms,
            "category": item.category,
            "difficulty": item.difficulty,
        }

    async def _update_user_stats(
        self,
        user_id: str,
        response: ImageRecognitionResponse,
        category: str,
        difficulty: str,
    ):
        """Update user statistics with new response."""
        stats = await self.repository.get_user_stats(user_id)

        if not stats:
            stats = UserImageRecognitionStats(user_id=user_id)

        # Update stats
        stats.update_stats(response, category, difficulty)

        # Recalculate average response time
        user_responses = await self.repository.get_user_responses(user_id, limit=1000)
        if user_responses:
            total_time = sum(r.response_time_ms for r in user_responses)
            stats.average_response_time_ms = total_time / len(user_responses)

        await self.repository.save_user_stats(stats)

    async def get_user_stats(self, user_id: str) -> dict:
        """Get user performance statistics."""
        stats = await self.repository.get_user_stats(user_id)

        if not stats:
            return {
                "total_attempts": 0,
                "correct_answers": 0,
                "accuracy_percentage": 0.0,
                "average_response_time_ms": 0.0,
                "category_stats": {},
                "difficulty_stats": {},
            }

        return {
            "total_attempts": stats.total_attempts,
            "correct_answers": stats.correct_answers,
            "accuracy_percentage": round(stats.accuracy_percentage, 2),
            "average_response_time_ms": round(stats.average_response_time_ms, 2),
            "category_stats": stats.category_stats,
            "difficulty_stats": stats.difficulty_stats,
            "last_updated": stats.last_updated.isoformat(),
        }

    async def get_user_history(
        self, user_id: str, limit: int = 20, skip: int = 0
    ) -> List[dict]:
        """Get user's response history."""
        responses = await self.repository.get_user_responses(user_id, limit, skip)

        history = []
        for response in responses:
            item = get_recognition_item_by_id(response.item_id)
            if item:
                history.append(
                    {
                        "timestamp": response.timestamp.isoformat(),
                        "question": item.question,
                        "selected_answer": next(
                            (
                                opt.text
                                for opt in item.options
                                if opt.id == response.selected_option_id
                            ),
                            "Unknown",
                        ),
                        "correct_answer": item.correct_answer,
                        "is_correct": response.is_correct,
                        "response_time_ms": response.response_time_ms,
                        "category": item.category,
                        "difficulty": item.difficulty,
                    }
                )

        return history

    async def get_global_stats(self) -> dict:
        """Get global performance statistics."""
        return await self.repository.get_global_stats()

    async def export_training_data(
        self, limit: int = 1000, skip: int = 0
    ) -> List[dict]:
        """Export data suitable for AI model training."""
        responses = await self.repository.get_responses_for_training(limit, skip)

        training_data = []
        for response in responses:
            item = get_recognition_item_by_id(response.item_id)
            if item:
                training_data.append(
                    {
                        "image_path": item.image_path,
                        "question": item.question,
                        "category": item.category,
                        "difficulty": item.difficulty,
                        "user_selected": response.selected_option_id,
                        "correct_answer": item.correct_option_id,
                        "is_correct": response.is_correct,
                        "response_time_ms": response.response_time_ms,
                        "confidence_level": response.confidence_level,
                        "timestamp": response.timestamp.isoformat(),
                    }
                )

        return training_data
