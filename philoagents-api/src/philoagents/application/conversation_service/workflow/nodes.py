from langchain_core.messages import RemoveMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import ToolNode

from philoagents.application.conversation_service.workflow.chains import (
    get_context_summary_chain,
    get_conversation_summary_chain,
    get_philosopher_response_chain,
)
from philoagents.application.conversation_service.workflow.state import PhilosopherState
from philoagents.application.conversation_service.workflow.tools import tools
from philoagents.config import settings

retriever_node = ToolNode(tools)


async def conversation_node(state: PhilosopherState, config: RunnableConfig):
    summary = state.get("summary", "")
    conversation_chain = get_philosopher_response_chain()

    # Build biotype context if available
    biotype_context = ""
    biotype_guidance = ""

    biotype_id = state.get("biotype_id")
    if biotype_id:
        biotype_sections = []

        if state.get("health_advice"):
            biotype_sections.append(f"Health Guidance: {state['health_advice']}")
        if state.get("dietary_recommendations"):
            biotype_sections.append(
                f"Dietary Wisdom: {state['dietary_recommendations']}"
            )
        if state.get("emotional_patterns"):
            biotype_sections.append(
                f"Emotional Patterns: {state['emotional_patterns']}"
            )
        if state.get("spiritual_practices"):
            biotype_sections.append(
                f"Spiritual Practices: {state['spiritual_practices']}"
            )
        if state.get("life_purpose_patterns"):
            biotype_sections.append(f"Life Purpose: {state['life_purpose_patterns']}")

        if biotype_sections:
            biotype_context = (
                f"Biotype ({biotype_id.title()}) Context:\n"
                + "\n\n".join(biotype_sections)
            )
            biotype_guidance = "\n- When appropriate, you may offer insights about health, lifestyle, emotional patterns, spiritual practices, or life purpose based on your biotype knowledge."

    response = await conversation_chain.ainvoke(
        {
            "messages": state["messages"],
            "philosopher_context": state["philosopher_context"],
            "philosopher_name": state["philosopher_name"],
            "philosopher_perspective": state["philosopher_perspective"],
            "philosopher_style": state["philosopher_style"],
            "biotype_context": biotype_context,
            "biotype_guidance": biotype_guidance,
            "summary": summary,
        },
        config,
    )

    return {"messages": response}


async def summarize_conversation_node(state: PhilosopherState):
    summary = state.get("summary", "")
    summary_chain = get_conversation_summary_chain(summary)

    response = await summary_chain.ainvoke(
        {
            "messages": state["messages"],
            "philosopher_name": state["philosopher_name"],
            "summary": summary,
        }
    )

    delete_messages = [
        RemoveMessage(id=m.id)
        for m in state["messages"][: -settings.TOTAL_MESSAGES_AFTER_SUMMARY]
    ]
    return {"summary": response.content, "messages": delete_messages}


async def summarize_context_node(state: PhilosopherState):
    context_summary_chain = get_context_summary_chain()

    response = await context_summary_chain.ainvoke(
        {
            "context": state["messages"][-1].content,
        }
    )
    state["messages"][-1].content = response.content

    return {}


async def connector_node(state: PhilosopherState):
    return {}
