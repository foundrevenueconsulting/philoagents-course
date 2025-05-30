from typing import Optional

from langgraph.graph import MessagesState


class PhilosopherState(MessagesState):
    """State class for the LangGraph workflow. It keeps track of the information necessary to maintain a coherent
    conversation between the Philosopher and the user.

    Attributes:
        philosopher_context (str): The historical and philosophical context of the philosopher.
        philosopher_name (str): The name of the philosopher.
        philosopher_perspective (str): The perspective of the philosopher about AI.
        philosopher_style (str): The style of the philosopher.
        biotype_id (Optional[str]): The biotype identifier for enhanced character.
        health_advice (Optional[str]): Biotype-specific health guidance.
        dietary_recommendations (Optional[str]): Biotype-specific dietary advice.
        emotional_patterns (Optional[str]): Biotype-specific emotional patterns.
        spiritual_practices (Optional[str]): Biotype-specific spiritual guidance.
        life_purpose_patterns (Optional[str]): Biotype-specific life purpose insights.
        summary (str): A summary of the conversation. This is used to reduce the token usage of the model.
    """

    philosopher_context: str
    philosopher_name: str
    philosopher_perspective: str
    philosopher_style: str
    biotype_id: Optional[str] = None
    health_advice: Optional[str] = None
    dietary_recommendations: Optional[str] = None
    emotional_patterns: Optional[str] = None
    spiritual_practices: Optional[str] = None
    life_purpose_patterns: Optional[str] = None
    summary: str


def state_to_str(state: PhilosopherState) -> str:
    if "summary" in state and bool(state["summary"]):
        conversation = state["summary"]
    elif "messages" in state and bool(state["messages"]):
        conversation = state["messages"]
    else:
        conversation = ""

    return f"""
PhilosopherState(philosopher_context={state["philosopher_context"]}, 
philosopher_name={state["philosopher_name"]}, 
philosopher_perspective={state["philosopher_perspective"]}, 
philosopher_style={state["philosopher_style"]}, 
conversation={conversation})
        """
