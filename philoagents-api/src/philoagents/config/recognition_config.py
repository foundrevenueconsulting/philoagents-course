"""
Configuration for image recognition practice feature.
Allows for different deployments with different recognition tasks.
"""

from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class RecognitionType(Enum):
    """Types of recognition tasks available."""
    TEMPERAMENTS = "temperaments"
    ANIMALS = "animals"
    COLORS = "colors"
    EMOTIONS = "emotions"


@dataclass
class RecognitionOption:
    """A single recognition option."""
    id: str
    label: str
    description: str = ""


@dataclass
class RecognitionConfig:
    """Configuration for a recognition task."""
    type: RecognitionType
    title: str
    description: str
    options: List[RecognitionOption]
    categories: List[str]
    difficulties: List[str]


# Classical Temperaments Configuration
TEMPERAMENTS_CONFIG = RecognitionConfig(
    type=RecognitionType.TEMPERAMENTS,
    title="BioType Recognition",
    description="Identify BioTypes from physical traits and body language",
    options=[
        RecognitionOption(
            id="choleric",
            label="Choleric",
            description="Ambitious, leader-like, energetic, passionate"
        ),
        RecognitionOption(
            id="phlegmatic", 
            label="Phlegmatic",
            description="Relaxed, peaceful, quiet, easy-going"
        ),
        RecognitionOption(
            id="sanguine",
            label="Sanguine", 
            description="Sociable, enthusiastic, active, spontaneous"
        ),
        RecognitionOption(
            id="melancholic",
            label="Melancholic",
            description="Thoughtful, reserved, perfectionist, moody"
        ),
    ],
    categories=["facial_expression", "body_language", "social_context", "emotional_state"],
    difficulties=["easy", "medium", "hard", "expert"]
)

# Alternative configurations for different deployments
ANIMALS_CONFIG = RecognitionConfig(
    type=RecognitionType.ANIMALS,
    title="Animal Recognition",
    description="Identify different types of animals",
    options=[
        RecognitionOption(id="dog", label="Dog"),
        RecognitionOption(id="cat", label="Cat"),
        RecognitionOption(id="bird", label="Bird"),
        RecognitionOption(id="fish", label="Fish"),
    ],
    categories=["mammals", "birds", "aquatic", "domestic"],
    difficulties=["easy", "medium", "hard"]
)

# Configuration registry
RECOGNITION_CONFIGS: Dict[str, RecognitionConfig] = {
    "temperaments": TEMPERAMENTS_CONFIG,
    "animals": ANIMALS_CONFIG,
}

# Current active configuration (can be set via environment variable)
import os
ACTIVE_CONFIG_TYPE = os.getenv("RECOGNITION_CONFIG", "temperaments")

def get_active_config() -> RecognitionConfig:
    """Get the currently active recognition configuration."""
    return RECOGNITION_CONFIGS.get(ACTIVE_CONFIG_TYPE, TEMPERAMENTS_CONFIG)

def get_config_by_type(config_type: str) -> RecognitionConfig:
    """Get a specific recognition configuration by type."""
    return RECOGNITION_CONFIGS.get(config_type, TEMPERAMENTS_CONFIG)