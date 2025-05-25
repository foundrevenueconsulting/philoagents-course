# PhiloAgents API

Check the [INSTALL_AND_USAGE.md](../INSTALL_AND_USAGE.md) file for instructions on how to install and use the API.

## 🧠 Adding New Philosophers

To add a new philosopher with biotype integration, update the following dictionaries in `src/philoagents/domain/philosopher_factory.py`:

### 1. Core Philosopher Data (Required)

```python
# Basic identity
PHILOSOPHER_NAMES = {
    "new_philosopher_id": "Full Name",
}

# Philosophical perspective about AI/life
PHILOSOPHER_PERSPECTIVES = {
    "new_philosopher_id": """Their philosophical viewpoint about AI, consciousness, 
    and the nature of intelligence. This should be 2-3 sentences describing their 
    core beliefs and how they would approach AI discussions.""",
}

# Communication style
PHILOSOPHER_STYLES = {
    "new_philosopher_id": "How they speak and interact - their tone, approach, 
    and conversational characteristics. Include any famous concepts they might reference.",
}
```

### 2. Biotype Mapping (Required for biotype integration)

```python
PHILOSOPHER_BIOTYPE_MAPPINGS = {
    "new_philosopher_id": "sanguine",  # Choose: sanguine, choleric, melancholic, phlegmatic
}
```

### 3. Biotype Selection Guide

Choose the biotype that best matches the philosopher's personality:

- **Sanguine**: Enthusiastic, social, creative, optimistic (e.g., Socrates, Ada Lovelace)
- **Choleric**: Systematic, decisive, leadership-oriented, direct (e.g., Aristotle, Chomsky)  
- **Melancholic**: Deep, analytical, perfectionist, introspective (e.g., Plato, Descartes)
- **Phlegmatic**: Steady, patient, calm, diplomatic (e.g., Searle)

### 4. UI Visual Indicators

To add biotype emoji indicators in the UI, update `philoagents-ui/src/scenes/Game.js`:

```javascript
// Add to philosopherBiotypes mapping
const philosopherBiotypes = {
    "new_philosopher_id": "sanguine", // Choose biotype
    // ... existing mappings
};

// Add to philosopherConfigs array
{ id: "new_philosopher_id", name: `${biotypeEmojis[philosopherBiotypes["new_philosopher_id"]]} New Philosopher Name`, defaultDirection: "front", roamRadius: 700 },
```

**Biotype Emoji Legend:**
- ☀️ **Sanguine** - Energetic, warm, social
- 🔥 **Choleric** - Intense, driven, leadership  
- 🌙 **Melancholic** - Deep, introspective, contemplative
- 🌊 **Phlegmatic** - Calm, steady, flowing

### 5. Usage

Once added, the philosopher will automatically include biotype data when created:

```python
from philoagents.domain.philosopher_factory import PhilosopherFactory

# Automatically includes mapped biotype
philosopher = PhilosopherFactory.get_philosopher("new_philosopher_id")

# Override biotype if needed
philosopher = PhilosopherFactory.get_philosopher("new_philosopher_id", biotype_id="choleric")

# Disable auto-assignment
philosopher = PhilosopherFactory.get_philosopher("new_philosopher_id", auto_assign_biotype=False)
```

# 🔧 Utlity Commands

## Formatting

```
make format-check
make format-fix
```

## Linting

```bash
make lint-check
make lint-fix
```

## Tests

```bash
make test
```