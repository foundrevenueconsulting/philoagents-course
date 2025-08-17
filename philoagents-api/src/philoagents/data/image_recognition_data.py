"""
Image recognition practice data configuration.
Contains metadata for practice images and their associated options.
"""

from typing import List, Optional
from dataclasses import dataclass
from philoagents.config.recognition_config import get_active_config


@dataclass
class ImageOption:
    """A single option for an image recognition question."""

    id: str
    text: str
    is_correct: bool


@dataclass
class ImageRecognitionItem:
    """A complete image recognition practice item."""

    id: str
    image_path: str
    question: str
    options: List[ImageOption]
    correct_option_id: str
    category: str
    difficulty: str

    @property
    def correct_answer(self) -> str:
        """Get the text of the correct answer."""
        for option in self.options:
            if option.is_correct:
                return option.text
        return ""


def _create_temperament_options(correct_temperament: str) -> List[ImageOption]:
    """Create the four temperament options with one marked as correct."""
    config = get_active_config()
    options = []
    
    for option_config in config.options:
        is_correct = option_config.id == correct_temperament
        options.append(ImageOption(
            id=option_config.id,
            text=option_config.label,
            is_correct=is_correct
        ))
    
    return options


# Practice items using real temperament images
SAMPLE_RECOGNITION_DATA: List[ImageRecognitionItem] = [
    ImageRecognitionItem(
        id="choleric_1",
        image_path="/images/recognition-practice/choleric/GettyImages-1498028237-scaled-e1691697169504.jpg copy.jpg",
        question="Based on this person's physical attributes, what biological biotype do they have?",
        options=_create_temperament_options("choleric"),
        correct_option_id="choleric",
        category="",
        difficulty="easy",
    ),
    ImageRecognitionItem(
        id="phlegmatic_1",
        image_path="/images/recognition-practice/phlegmatic/omg_goddess-244279306-1269368244.webp",
        question="Based on this person's physical attributes, what biological biotype do they have?",
        options=_create_temperament_options("phlegmatic"),
        correct_option_id="phlegmatic",
        category="",
        difficulty="easy",
    ),
    ImageRecognitionItem(
        id="sanguine_1",
        image_path="/images/recognition-practice/sanguine/90.jpeg",
        question="Based on this person's physical attributes, what biological biotype do they have?",
        options=_create_temperament_options("sanguine"),
        correct_option_id="sanguine",
        category="",
        difficulty="medium",
    ),
    ImageRecognitionItem(
        id="melancholic_1",
        image_path="/images/recognition-practice/melancholic/Adrien-Brody-1.jpg",
        question="Based on this person's physical attributes, what biological biotype do they have?",
        options=_create_temperament_options("melancholic"),
        correct_option_id="melancholic",
        category="",
        difficulty="medium",
    ),
    ImageRecognitionItem(
        id="sanguine_2",
        image_path="/images/recognition-practice/sanguine/ap-jack-black-friars-club-roast-16_9.jpg.webp",
        question="Based on this person's physical attributes, what biological biotype do they have?",
        options=_create_temperament_options("sanguine"),
        correct_option_id="sanguine",
        category="",
        difficulty="easy",
    ),
]


def get_random_recognition_item(exclude_item_id: Optional[str] = None) -> ImageRecognitionItem:
    """Get a random image recognition practice item, optionally excluding one."""
    import random

    available_items = SAMPLE_RECOGNITION_DATA
    
    # Filter out the excluded item if provided
    if exclude_item_id:
        available_items = [item for item in SAMPLE_RECOGNITION_DATA 
                          if item.id != exclude_item_id]
    
    # Fallback if we filtered out everything (shouldn't happen with 5 items)
    if not available_items:
        available_items = SAMPLE_RECOGNITION_DATA
    
    return random.choice(available_items)


def get_recognition_item_by_id(item_id: str) -> ImageRecognitionItem | None:
    """Get a specific recognition item by ID."""
    for item in SAMPLE_RECOGNITION_DATA:
        if item.id == item_id:
            return item
    return None


def get_all_recognition_items() -> List[ImageRecognitionItem]:
    """Get all available recognition items."""
    return SAMPLE_RECOGNITION_DATA.copy()
