"""
Image configuration for recognition practice.
Supports multiple image sources and environments.
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class ImageSource(Enum):
    """Available image sources."""
    LOCAL = "local"
    CLOUDINARY = "cloudinary"
    S3 = "s3"
    UNSPLASH = "unsplash"
    PEXELS = "pexels"


@dataclass
class ImageConfig:
    """Configuration for image serving."""
    source: ImageSource
    base_url: str
    api_key: Optional[str] = None
    bucket_name: Optional[str] = None
    transformation_params: Optional[Dict] = None


@dataclass
class TemperamentImageSet:
    """Images for a specific temperament with metadata."""
    temperament: str
    images: List[Dict[str, str]]  # [{"url": "...", "description": "...", "difficulty": "..."}]
    

# Default local configuration (for development/MVP)
LOCAL_CONFIG = ImageConfig(
    source=ImageSource.LOCAL,
    base_url="/images/recognition-practice"
)

# Cloudinary configuration (recommended for production)
CLOUDINARY_CONFIG = ImageConfig(
    source=ImageSource.CLOUDINARY,
    base_url=f"https://res.cloudinary.com/{os.getenv('CLOUDINARY_CLOUD_NAME', 'your-cloud-name')}/image/upload",
    transformation_params={
        "width": 800,
        "height": 600,
        "crop": "fill",
        "quality": "auto",
        "format": "auto"
    }
)

# AWS S3 configuration
S3_CONFIG = ImageConfig(
    source=ImageSource.S3,
    base_url=f"https://{os.getenv('AWS_S3_BUCKET', 'your-bucket')}.s3.amazonaws.com",
    bucket_name=os.getenv('AWS_S3_BUCKET', 'your-bucket')
)

# Unsplash configuration (for development/testing)
UNSPLASH_CONFIG = ImageConfig(
    source=ImageSource.UNSPLASH,
    base_url="https://api.unsplash.com/photos",
    api_key=os.getenv('UNSPLASH_ACCESS_KEY')
)

# Configuration registry
IMAGE_CONFIGS: Dict[str, ImageConfig] = {
    "local": LOCAL_CONFIG,
    "cloudinary": CLOUDINARY_CONFIG,
    "s3": S3_CONFIG,
    "unsplash": UNSPLASH_CONFIG,
}

# Active configuration
ACTIVE_IMAGE_SOURCE = os.getenv("IMAGE_SOURCE", "local")

def get_active_image_config() -> ImageConfig:
    """Get the currently active image configuration."""
    return IMAGE_CONFIGS.get(ACTIVE_IMAGE_SOURCE, LOCAL_CONFIG)

def build_image_url(image_path: str, config: Optional[ImageConfig] = None) -> str:
    """Build a complete image URL based on the active configuration."""
    if config is None:
        config = get_active_image_config()
    
    if config.source == ImageSource.LOCAL:
        return f"{config.base_url}/{image_path}"
    
    elif config.source == ImageSource.CLOUDINARY:
        # Build Cloudinary URL with transformations
        if config.transformation_params:
            transform_str = "/".join([f"{k}_{v}" for k, v in config.transformation_params.items()])
            return f"{config.base_url}/{transform_str}/{image_path}"
        return f"{config.base_url}/{image_path}"
    
    elif config.source == ImageSource.S3:
        return f"{config.base_url}/{image_path}"
    
    else:
        return f"{config.base_url}/{image_path}"

# Temperament image sets with organized file structure
TEMPERAMENT_IMAGE_SETS: Dict[str, TemperamentImageSet] = {
    "choleric": TemperamentImageSet(
        temperament="choleric",
        images=[
            {
                "filename": "choleric/GettyImages-1498028237-scaled-e1691697169504.jpg copy.jpg",
                "description": "Confident business executive giving presentation"
            }
        ]
    ),
    "phlegmatic": TemperamentImageSet(
        temperament="phlegmatic",
        images=[
            {
                "filename": "phlegmatic/omg_goddess-244279306-1269368244.webp",
                "description": "Person in peaceful meditation pose"
            }
        ]
    ),
    "sanguine": TemperamentImageSet(
        temperament="sanguine",
        images=[
            {
                "filename": "sanguine/90.jpeg",
                "description": "Group of people laughing at social gathering"
            },
            {
                "filename": "sanguine/ap-jack-black-friars-club-roast-16_9.jpg.webp",
                "description": "Person telling animated story with gestures"
            }
        ]
    ),
    "melancholic": TemperamentImageSet(
        temperament="melancholic",
        images=[
            {
                "filename": "melancholic/Adrien-Brody-1.jpg",
                "description": "Person reading thoughtfully in quiet space"
            },
            {
                "filename": "melancholic/keira-knightley.jpg.webp",
                "description": "Artist working on detailed painting"
            }
        ]
    )
}

def get_images_for_temperament(temperament: str) -> List[Dict[str, str]]:
    """Get all available images for a specific temperament."""
    image_set = TEMPERAMENT_IMAGE_SETS.get(temperament)
    if not image_set:
        return []
    
    config = get_active_image_config()
    images_with_urls = []
    
    for image_info in image_set.images:
        image_with_url = image_info.copy()
        image_with_url["url"] = build_image_url(image_info["filename"], config)
        images_with_urls.append(image_with_url)
    
    return images_with_urls

def get_random_image_for_temperament(temperament: str) -> Optional[str]:
    """Get a random image URL for a specific temperament."""
    images = get_images_for_temperament(temperament)
    if not images:
        # Fallback to simple filename approach
        config = get_active_image_config()
        return build_image_url(f"{temperament}_sample.jpg", config)
    
    import random
    return random.choice(images)["url"]