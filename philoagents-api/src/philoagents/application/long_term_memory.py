from langchain_core.documents import Document
from loguru import logger

from philoagents.application.data import deduplicate_documents, get_extraction_generator
from philoagents.application.rag.retrievers import Retriever, get_retriever
from philoagents.application.rag.splitters import Splitter, get_splitter
from philoagents.config import settings
from philoagents.domain.philosopher import PhilosopherExtract
from philoagents.domain.philosopher_factory import (
    BIOTYPE_HEALTH_ADVICE,
    BIOTYPE_DIETARY_RECOMMENDATIONS,
    BIOTYPE_EMOTIONAL_PATTERNS,
    BIOTYPE_SPIRITUAL_PRACTICES,
    BIOTYPE_LIFE_PURPOSE_PATTERNS,
    BIOTYPE_NAMES,
)
from philoagents.infrastructure.mongo import MongoClientWrapper, MongoIndex


class LongTermMemoryCreator:
    def __init__(self, retriever: Retriever, splitter: Splitter) -> None:
        self.retriever = retriever
        self.splitter = splitter

    @classmethod
    def build_from_settings(cls) -> "LongTermMemoryCreator":
        retriever = get_retriever(
            embedding_model_id=settings.RAG_TEXT_EMBEDDING_MODEL_ID,
            k=settings.RAG_TOP_K,
            device=settings.RAG_DEVICE,
        )
        splitter = get_splitter(chunk_size=settings.RAG_CHUNK_SIZE)

        return cls(retriever, splitter)

    def __call__(self, philosophers: list[PhilosopherExtract]) -> None:
        if len(philosophers) == 0:
            logger.warning("No philosophers to extract. Exiting.")

            return

        # First clear the long term memory collection to avoid duplicates.
        with MongoClientWrapper(
            model=Document, collection_name=settings.MONGO_LONG_TERM_MEMORY_COLLECTION
        ) as client:
            client.clear_collection()

        # Add biotype knowledge to the knowledge base
        self._add_biotype_knowledge()

        extraction_generator = get_extraction_generator(philosophers)
        for _, docs in extraction_generator:
            chunked_docs = self.splitter.split_documents(docs)

            chunked_docs = deduplicate_documents(chunked_docs, threshold=0.7)

            self.retriever.vectorstore.add_documents(chunked_docs)

        self.__create_index()

    def _add_biotype_knowledge(self) -> None:
        """Add biotype knowledge as documents to the vector store."""
        logger.info("Adding biotype knowledge to long-term memory...")

        biotype_documents = []

        for biotype_id, biotype_name in BIOTYPE_NAMES.items():
            # Create comprehensive biotype documents
            knowledge_sections = []

            if biotype_id in BIOTYPE_HEALTH_ADVICE:
                knowledge_sections.append(
                    f"Health Advice for {biotype_name}:\n{BIOTYPE_HEALTH_ADVICE[biotype_id]}"
                )

            if biotype_id in BIOTYPE_DIETARY_RECOMMENDATIONS:
                knowledge_sections.append(
                    f"Dietary Recommendations for {biotype_name}:\n{BIOTYPE_DIETARY_RECOMMENDATIONS[biotype_id]}"
                )

            if biotype_id in BIOTYPE_EMOTIONAL_PATTERNS:
                knowledge_sections.append(
                    f"Emotional Patterns of {biotype_name}:\n{BIOTYPE_EMOTIONAL_PATTERNS[biotype_id]}"
                )

            if biotype_id in BIOTYPE_SPIRITUAL_PRACTICES:
                knowledge_sections.append(
                    f"Spiritual Practices for {biotype_name}:\n{BIOTYPE_SPIRITUAL_PRACTICES[biotype_id]}"
                )

            if biotype_id in BIOTYPE_LIFE_PURPOSE_PATTERNS:
                knowledge_sections.append(
                    f"Life Purpose Patterns of {biotype_name}:\n{BIOTYPE_LIFE_PURPOSE_PATTERNS[biotype_id]}"
                )

            # Create individual documents for each knowledge section
            for section in knowledge_sections:
                doc = Document(
                    page_content=section,
                    metadata={
                        "source": f"biotype_{biotype_id}",
                        "biotype": biotype_id,
                        "biotype_name": biotype_name,
                        "type": "biotype_knowledge",
                    },
                )
                biotype_documents.append(doc)

        if biotype_documents:
            # Split documents for optimal retrieval
            chunked_docs = self.splitter.split_documents(biotype_documents)
            chunked_docs = deduplicate_documents(chunked_docs, threshold=0.7)
            self.retriever.vectorstore.add_documents(chunked_docs)
            logger.info(
                f"Added {len(chunked_docs)} biotype knowledge chunks to vector store"
            )

    def __create_index(self) -> None:
        with MongoClientWrapper(
            model=Document, collection_name=settings.MONGO_LONG_TERM_MEMORY_COLLECTION
        ) as client:
            self.index = MongoIndex(
                retriever=self.retriever,
                mongodb_client=client,
            )
            self.index.create(
                is_hybrid=True, embedding_dim=settings.RAG_TEXT_EMBEDDING_MODEL_DIM
            )


class LongTermMemoryRetriever:
    def __init__(self, retriever: Retriever) -> None:
        self.retriever = retriever

    @classmethod
    def build_from_settings(cls) -> "LongTermMemoryRetriever":
        retriever = get_retriever(
            embedding_model_id=settings.RAG_TEXT_EMBEDDING_MODEL_ID,
            k=settings.RAG_TOP_K,
            device=settings.RAG_DEVICE,
        )

        return cls(retriever)

    def __call__(self, query: str) -> list[Document]:
        return self.retriever.invoke(query)
