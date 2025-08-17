#!/usr/bin/env python3
"""
Image Setup Script for Temperament Recognition
Helps organize and verify images for the temperament recognition feature.
"""

import os
import shutil
from pathlib import Path
from typing import List, Dict

# Expected image files for each temperament
TEMPERAMENT_IMAGES = {
    "choleric": [
        "business_leader_01.jpg",
        "athlete_victory_01.jpg", 
        "debate_speaker_01.jpg"
    ],
    "phlegmatic": [
        "meditation_01.jpg",
        "casual_conversation_01.jpg"
    ],
    "sanguine": [
        "party_laughter_01.jpg",
        "animated_storyteller_01.jpg"
    ],
    "melancholic": [
        "reader_01.jpg",
        "artist_01.jpg"
    ]
}

def create_directory_structure():
    """Create the directory structure for temperament images."""
    base_path = Path("philoagents-nextjs/public/images/recognition-practice")
    base_path.mkdir(parents=True, exist_ok=True)
    
    for temperament in TEMPERAMENT_IMAGES.keys():
        temp_path = base_path / temperament
        temp_path.mkdir(exist_ok=True)
        print(f"✓ Created directory: {temp_path}")

def check_missing_images():
    """Check which images are missing and need to be added."""
    base_path = Path("philoagents-nextjs/public/images/recognition-practice")
    missing_images = []
    
    for temperament, images in TEMPERAMENT_IMAGES.items():
        temp_path = base_path / temperament
        for image in images:
            image_path = temp_path / image
            if not image_path.exists():
                missing_images.append(f"{temperament}/{image}")
    
    return missing_images

def create_placeholder_images():
    """Create placeholder images for missing files."""
    base_path = Path("philoagents-nextjs/public/images/recognition-practice")
    
    # Create a simple placeholder script
    placeholder_script = """
# Use this to create placeholder images with ImageMagick (if installed):
# convert -size 800x600 xc:lightgray -pointsize 24 -gravity center \\
#   -annotate +0+0 "PLACEHOLDER\\n{temperament}\\n{filename}" {output_path}

# Or use any image editing tool to create 800x600 images with the temperament name
"""
    
    missing_images = check_missing_images()
    if missing_images:
        print(f"\n📋 Missing {len(missing_images)} images:")
        for image in missing_images:
            print(f"   - {image}")
        
        print(f"\n📂 Add your images to: {base_path.absolute()}")
        print("\n💡 Recommended image specifications:")
        print("   - Format: JPG, PNG, or WebP")
        print("   - Size: 800x600px (or similar 4:3 aspect ratio)")
        print("   - File size: Under 1MB each")
        print("   - Clear facial expressions and body language")
        
        # Create README in each directory
        for temperament in TEMPERAMENT_IMAGES.keys():
            temp_path = base_path / temperament
            readme_path = temp_path / "README.md"
            
            with open(readme_path, 'w') as f:
                f.write(f"# {temperament.title()} Temperament Images\n\n")
                f.write(f"Add the following images to this directory:\n\n")
                for image in TEMPERAMENT_IMAGES[temperament]:
                    f.write(f"- {image}\n")
                f.write(f"\n{placeholder_script}")
    else:
        print("✓ All images are present!")

def verify_image_config():
    """Verify that the image configuration matches the actual files."""
    print("\n🔍 Verifying image configuration...")
    
    # Import the config (assuming we're in the right directory)
    try:
        import sys
        sys.path.append("philoagents-api/src")
        from philoagents.config.image_config import TEMPERAMENT_IMAGE_SETS
        
        config_images = {}
        for temp, image_set in TEMPERAMENT_IMAGE_SETS.items():
            config_images[temp] = [img["filename"] for img in image_set.images]
        
        # Compare with expected structure
        mismatches = []
        for temperament, expected in TEMPERAMENT_IMAGES.items():
            expected_full = [f"{temperament}/{img}" for img in expected]
            config_imgs = config_images.get(temperament, [])
            
            if set(expected_full) != set(config_imgs):
                mismatches.append(temperament)
        
        if mismatches:
            print(f"⚠️  Configuration mismatches found in: {', '.join(mismatches)}")
            print("   Check philoagents-api/src/philoagents/config/image_config.py")
        else:
            print("✓ Image configuration matches expected structure")
            
    except ImportError as e:
        print(f"ℹ️  Could not verify config (run from project root): {e}")

def main():
    """Main setup function."""
    print("🖼️  Temperament Recognition Image Setup")
    print("=" * 50)
    
    # Step 1: Create directories
    print("\n1. Creating directory structure...")
    create_directory_structure()
    
    # Step 2: Check for missing images
    print("\n2. Checking for missing images...")
    create_placeholder_images()
    
    # Step 3: Verify configuration
    print("\n3. Verifying configuration...")
    verify_image_config()
    
    print("\n✨ Setup complete!")
    print("\n📝 Next steps:")
    print("   1. Add real images to the directories created")
    print("   2. Test the feature at http://localhost:3000/practice")
    print("   3. Update image paths in config if needed")

if __name__ == "__main__":
    main()