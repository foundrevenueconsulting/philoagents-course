from langchain_openai import OpenAIEmbeddings
import os

EmbeddingsModel = OpenAIEmbeddings


def get_embedding_model(model_id: str, device: str = "cpu") -> EmbeddingsModel:
    """Gets an OpenAI embedding model for Railway deployment."""
    return OpenAIEmbeddings(
        model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY")
    )


def get_huggingface_embedding_model(model_id: str, device: str) -> OpenAIEmbeddings:
    """Fallback to OpenAI for Railway deployment."""
    return get_embedding_model(model_id, device)
