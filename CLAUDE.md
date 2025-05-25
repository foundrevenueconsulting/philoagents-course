# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Setup and Commands

### Environment Setup
```bash
cd philoagents-api
uv venv .venv
. ./.venv/bin/activate
uv pip install -e .
cp .env.example .env  # Configure API keys as needed
```

### Essential Commands

**Infrastructure Management:**
```bash
# From root directory
make infrastructure-up      # Start all services (MongoDB, API, UI)
make infrastructure-stop    # Stop all services
make infrastructure-build   # Build Docker images without running

# IMPORTANT: After code changes, restart containers to pick up changes
make infrastructure-restart    # Quick restart with rebuild
make infrastructure-logs       # View container logs
make infrastructure-status     # Check container status
```

**Development in philoagents-api/:**
```bash
uv run ruff format .        # Format code
uv run ruff check --fix     # Fix linting issues
uv run ruff check .         # Check code quality
```

**Agent Operations:**
```bash
# From root directory
make create-long-term-memory     # Populate philosopher knowledge base
make call-agent                  # Test agent directly (bypasses UI)
make delete-long-term-memory     # Clear knowledge base
```

**Evaluation (Module 5):**
```bash
make generate-evaluation-dataset  # Create new evaluation dataset
make evaluate-agent              # Run agent evaluation
```

## Architecture Overview

### Core System Design
This is a **production-ready AI agent simulation engine** with clean architecture:

- **philoagents-api/**: Python FastAPI backend with LangGraph agent workflow
- **philoagents-ui/**: Phaser.js game frontend with real-time WebSocket communication
- **Infrastructure**: MongoDB Atlas for agent state/memory + vector search for RAG

### Key Architectural Patterns

**Agent Workflow (LangGraph):**
- State machine in `workflow/graph.py` orchestrates conversation flow
- Nodes handle different processing stages (conversation, retrieval, summarization)
- Conditional edges route between RAG retrieval and direct responses

**Memory Architecture:**
- **Short-term**: LangGraph checkpoints in MongoDB (conversation state)
- **Long-term**: Vector-indexed documents in MongoDB (philosopher knowledge)
- Dual-memory system with automatic summarization after 30 messages

**RAG System:**
- Vector embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- Document chunking at 256 tokens
- Retrieval tool integrated into LangGraph workflow
- Context summarization to manage token limits

### Package Structure
```
src/philoagents/
├── application/           # Business logic layer
│   ├── conversation_service/  # LangGraph workflow implementation
│   ├── rag/              # Vector retrieval components  
│   └── long_term_memory.py   # Knowledge base management
├── domain/               # Core business entities
│   ├── philosopher.py    # Character models and factory
│   └── prompts.py        # System prompts for characters
└── infrastructure/      # External integrations
    ├── api.py           # FastAPI endpoints and WebSocket
    └── mongo/           # MongoDB client and indexing
```

### Configuration
- Environment variables defined in `config.py` using pydantic-settings
- Required: `GROQ_API_KEY` for LLM inference
- Optional: `OPENAI_API_KEY` (evaluation), `COMET_API_KEY` (monitoring)
- MongoDB connection defaults to local Docker instance

### Access Points
- Game UI: http://localhost:8080
- API docs: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws/chat (real-time streaming)
- REST: POST /chat (standard chat), POST /reset-memory (clear state)

## Development Workflow

1. Always run `make infrastructure-up` first to start dependencies
2. Use `make create-long-term-memory` to populate knowledge base for RAG
3. Test changes via game UI or `make call-agent`
4. Run linting before commits: `uv run ruff check --fix`
5. Monitor traces in Opik dashboard if `COMET_API_KEY` is configured