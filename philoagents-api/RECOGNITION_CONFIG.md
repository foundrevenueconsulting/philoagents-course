# Recognition Practice Configuration

The image recognition practice feature supports multiple recognition tasks through configuration.

## Current Configuration: Temperament Recognition

The system is currently configured for **Classical Temperament Recognition** with the following options:

- **Choleric**: Ambitious, leader-like, energetic, passionate
- **Phlegmatic**: Relaxed, peaceful, quiet, easy-going  
- **Sanguine**: Sociable, enthusiastic, active, spontaneous
- **Melancholic**: Thoughtful, reserved, perfectionist, moody

## Changing Configuration

To deploy a different recognition task, set the `RECOGNITION_CONFIG` environment variable:

```bash
# For temperament recognition (default)
export RECOGNITION_CONFIG=temperaments

# For animal recognition
export RECOGNITION_CONFIG=animals
```

## Adding New Configurations

1. Edit `src/philoagents/config/recognition_config.py`
2. Add a new `RecognitionConfig` instance
3. Register it in the `RECOGNITION_CONFIGS` dictionary
4. Update sample data in `src/philoagents/data/image_recognition_data.py`

## Sample Data

The system includes 5 sample questions for each configuration type. These should be replaced with real images and questions in production.

## Categories

Current temperament categories:
- `facial_expression`: Questions focused on facial expressions
- `body_language`: Questions about posture and body positioning  
- `social_context`: Questions about social interaction patterns
- `emotional_state`: Questions about emotional expressions

## Difficulties

- `easy`: Clear, obvious examples
- `medium`: Moderate difficulty requiring attention to detail
- `hard`: Subtle expressions requiring expertise
- `expert`: Very challenging cases for advanced users