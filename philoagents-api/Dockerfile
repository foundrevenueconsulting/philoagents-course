FROM python:3.11-slim as builder

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory.
WORKDIR /app

# Copy Railway-optimized dependencies and create lockfile
COPY pyproject.railway.toml pyproject.toml
COPY README.md ./
RUN uv lock && uv sync --frozen --no-cache --no-dev

FROM python:3.11-slim

# Set the working directory.
WORKDIR /app

# Copy the virtual environment from builder stage.
COPY --from=builder /app/.venv /app/.venv

# Copy the application into the container.
COPY src/philoagents philoagents/
COPY tools tools/

# Replace HuggingFace embeddings with OpenAI for Railway
COPY embeddings.railway.py philoagents/application/rag/embeddings.py
COPY retrievers.railway.py philoagents/application/rag/retrievers.py

# Set PATH to include the virtual environment.
ENV PATH="/app/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

CMD ["fastapi", "run", "philoagents/infrastructure/api.py", "--port", "8000", "--host", "0.0.0.0"]