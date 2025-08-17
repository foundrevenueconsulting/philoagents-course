"""
Domain models for image recognition practice feature.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ImageRecognitionOption(BaseModel):
    """A single option for an image recognition question."""

    id: str
    text: str
    is_correct: bool


class ImageRecognitionQuestion(BaseModel):
    """A complete image recognition question."""

    id: Optional[str] = Field(default=None, alias="_id")
    item_id: str  # References the item from the data file
    image_path: str
    question: str
    options: List[ImageRecognitionOption]
    correct_option_id: str
    category: str
    difficulty: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True


class ImageRecognitionResponse(BaseModel):
    """A user's response to an image recognition question."""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str  # From Clerk authentication
    item_id: str  # References the practice item
    selected_option_id: str
    is_correct: bool
    response_time_ms: int  # Time taken to answer in milliseconds
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Additional fields for training data
    confidence_level: Optional[int] = None  # 1-5 scale if user provides
    user_agent: Optional[str] = None
    session_id: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class UserImageRecognitionStats(BaseModel):
    """Aggregated statistics for a user's image recognition practice."""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    total_attempts: int = 0
    correct_answers: int = 0
    accuracy_percentage: float = 0.0
    average_response_time_ms: float = 0.0
    category_stats: dict = Field(default_factory=dict)  # category -> {correct, total}
    difficulty_stats: dict = Field(
        default_factory=dict
    )  # difficulty -> {correct, total}
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True

    def update_stats(
        self, response: ImageRecognitionResponse, category: str, difficulty: str
    ):
        """Update statistics with a new response."""
        self.total_attempts += 1
        if response.is_correct:
            self.correct_answers += 1

        self.accuracy_percentage = (self.correct_answers / self.total_attempts) * 100

        # Update category stats
        if category not in self.category_stats:
            self.category_stats[category] = {"correct": 0, "total": 0}
        self.category_stats[category]["total"] += 1
        if response.is_correct:
            self.category_stats[category]["correct"] += 1

        # Update difficulty stats
        if difficulty not in self.difficulty_stats:
            self.difficulty_stats[difficulty] = {"correct": 0, "total": 0}
        self.difficulty_stats[difficulty]["total"] += 1
        if response.is_correct:
            self.difficulty_stats[difficulty]["correct"] += 1

        self.last_updated = datetime.utcnow()
