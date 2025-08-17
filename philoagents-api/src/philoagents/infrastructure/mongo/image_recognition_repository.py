"""
MongoDB repository for image recognition practice data.
"""

from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from philoagents.domain.image_recognition import (
    ImageRecognitionResponse,
    UserImageRecognitionStats,
)
from philoagents.config import settings


class ImageRecognitionRepository:
    """Repository for image recognition practice data in MongoDB."""

    def __init__(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        self.db: AsyncIOMotorDatabase = self.client[settings.MONGO_DB_NAME]
        self.responses_collection: AsyncIOMotorCollection = (
            self.db.image_recognition_responses
        )
        self.stats_collection: AsyncIOMotorCollection = (
            self.db.user_image_recognition_stats
        )

    async def save_response(self, response: ImageRecognitionResponse) -> str:
        """Save a user's response to an image recognition question."""
        # Convert to dict and exclude the id field for insertion
        doc = response.model_dump(by_alias=True, exclude={"id"})
        result = await self.responses_collection.insert_one(doc)
        return str(result.inserted_id)

    async def get_user_responses(
        self, user_id: str, limit: int = 100, skip: int = 0
    ) -> List[ImageRecognitionResponse]:
        """Get a user's responses, most recent first."""
        cursor = (
            self.responses_collection.find({"user_id": user_id})
            .sort("timestamp", -1)
            .skip(skip)
            .limit(limit)
        )

        responses = []
        async for doc in cursor:
            # Convert ObjectId to string for Pydantic model
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            responses.append(ImageRecognitionResponse(**doc))
        return responses

    async def get_user_stats(self, user_id: str) -> Optional[UserImageRecognitionStats]:
        """Get aggregated statistics for a user."""
        doc = await self.stats_collection.find_one({"user_id": user_id})
        if doc:
            # Convert ObjectId to string for Pydantic model
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return UserImageRecognitionStats(**doc)
        return None

    async def save_user_stats(self, stats: UserImageRecognitionStats) -> str:
        """Save or update user statistics."""
        result = await self.stats_collection.replace_one(
            {"user_id": stats.user_id},
            stats.model_dump(by_alias=True, exclude={"id"}),
            upsert=True,
        )
        return str(result.upserted_id or stats.id)

    async def get_responses_for_training(
        self, limit: int = 1000, skip: int = 0
    ) -> List[ImageRecognitionResponse]:
        """Get responses suitable for training data export."""
        cursor = self.responses_collection.find().skip(skip).limit(limit)

        responses = []
        async for doc in cursor:
            # Convert ObjectId to string for Pydantic model
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            responses.append(ImageRecognitionResponse(**doc))
        return responses

    async def get_global_stats(self) -> dict:
        """Get global statistics across all users."""
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_responses": {"$sum": 1},
                    "correct_responses": {
                        "$sum": {"$cond": [{"$eq": ["$is_correct", True]}, 1, 0]}
                    },
                    "average_response_time": {"$avg": "$response_time_ms"},
                    "unique_users": {"$addToSet": "$user_id"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "total_responses": 1,
                    "correct_responses": 1,
                    "accuracy_percentage": {
                        "$multiply": [
                            {"$divide": ["$correct_responses", "$total_responses"]},
                            100,
                        ]
                    },
                    "average_response_time": 1,
                    "unique_users_count": {"$size": "$unique_users"},
                }
            },
        ]

        async for doc in self.responses_collection.aggregate(pipeline):
            return doc

        return {
            "total_responses": 0,
            "correct_responses": 0,
            "accuracy_percentage": 0.0,
            "average_response_time": 0.0,
            "unique_users_count": 0,
        }

    async def get_category_performance(self, user_id: Optional[str] = None) -> dict:
        """Get performance statistics by category."""
        match_stage = {}
        if user_id:
            match_stage["user_id"] = user_id

        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {
                "$lookup": {
                    "from": "image_recognition_questions",
                    "localField": "item_id",
                    "foreignField": "item_id",
                    "as": "question_data",
                }
            },
            {"$unwind": "$question_data"},
            {
                "$group": {
                    "_id": "$question_data.category",
                    "total": {"$sum": 1},
                    "correct": {
                        "$sum": {"$cond": [{"$eq": ["$is_correct", True]}, 1, 0]}
                    },
                    "avg_response_time": {"$avg": "$response_time_ms"},
                }
            },
            {
                "$project": {
                    "category": "$_id",
                    "total": 1,
                    "correct": 1,
                    "accuracy": {
                        "$multiply": [{"$divide": ["$correct", "$total"]}, 100]
                    },
                    "avg_response_time": 1,
                    "_id": 0,
                }
            },
        ]

        results = {}
        async for doc in self.responses_collection.aggregate(pipeline):
            results[doc["category"]] = doc

        return results
