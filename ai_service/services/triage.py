from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
import os
from services.vector_store import VectorStore


class TriageResult(BaseModel):
    symptoms_extracted: List[str] = Field(description="List of symptoms identified from the user input")
    severity_score: int = Field(description="Severity score from 1 to 10")
    possible_conditions: List[str] = Field(description="Non-diagnostic list of possible conditions")
    recommendation: str = Field(description="Immediate suggested next steps for the patient")
    follow_up_questions: List[str] = Field(description="Clarifying questions to ask the user")
    is_emergency: bool = Field(description="True if the situation requires immediate medical attention")
    confidence: int = Field(default=85, description="AI confidence score from 0 to 100")
    classification: str = Field(default="mild", description="Classification: mild, moderate, or emergency")
    sources: List[str] = Field(default=[], description="List of source guideline documents used in RAG (e.g. ['fever.md'])")


class TriageEngine:
    def __init__(self):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key and groq_api_key != "your_groq_api_key_here":
            print("Using Groq API Key and llama-3.3-70b-versatile model.")
            self.llm = ChatOpenAI(
                model="llama-3.3-70b-versatile",
                temperature=0,
                api_key=groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        else:
            print("Using OpenAI API Key and gpt-4o model.")
            self.llm = ChatOpenAI(
                model="gpt-4o",
                temperature=0,
                api_key=os.getenv("OPENAI_API_KEY")
            )
        self.parser = PydanticOutputParser(pydantic_object=TriageResult)
        self.vector_store = VectorStore()

    async def analyze_symptoms(self, query: str, user_history: Optional[str] = None) -> TriageResult:
        # Perform similarity search in the VectorStore
        retrieved_docs = self.vector_store.search(query, k=2)
        
        context_str = ""
        if retrieved_docs:
            context_blocks = []
            for doc in retrieved_docs:
                context_blocks.append(
                    f"Source File: {doc['source']}\n"
                    f"Title: {doc['title']} - {doc['heading']}\n"
                    f"Content:\n{doc['text']}"
                )
            context_str = "\n\n=== NEXT SECTION ===\n\n".join(context_blocks)
        else:
            context_str = "No specific guidelines found for this query. Use general medical knowledge with appropriate precautions."

        prompt = ChatPromptTemplate.from_template(
            """
            You are a senior medical triage assistant for a public healthcare system.
            Your role is to analyze symptoms and provide structured triage guidance.
            
            Refer to the following retrieved official medical guidelines for context if relevant to the query:
            ---
            {context}
            ---

            IMPORTANT RULES:
            1. Be empathetic, clear, and use simple language understandable by non-medical users.
            2. Extract ALL relevant symptoms from the user's description.
            3. Provide a severity score from 1 (minor) to 10 (life-threatening):
               - 1-3: Mild (home care appropriate)
               - 4-6: Moderate (doctor visit recommended)
               - 7-8: Serious (urgent medical attention needed)
               - 9-10: Emergency (call emergency services immediately)
            4. Set is_emergency to True if severity >= 8.
            5. Provide non-diagnostic 'possible conditions' — always note these are NOT a diagnosis.
            6. Suggest concrete next steps based on severity and the retrieved medical guidelines.
            7. Ask up to 3 targeted follow-up questions to clarify the situation.
            8. Set classification to 'mild', 'moderate', or 'emergency' based on severity.
            9. Set confidence to a percentage (0-100) indicating how confident the analysis is.
            10. Set sources to the exact filenames of the retrieved guidelines that were relevant and referenced in your recommendation (e.g. ['fever.md']). If no guidelines were relevant or retrieved, leave this empty.
            11. RED FLAGS that MUST trigger high severity (8+):
                - Chest pain, difficulty breathing, severe bleeding
                - Loss of consciousness, seizures, stroke symptoms
                - Severe allergic reactions, poisoning
                - High fever (>104°F/40°C) with altered consciousness

            User Query: {query}
            User History (optional): {history}

            {format_instructions}
            """
        )

        chain = prompt | self.llm | self.parser

        result = await chain.ainvoke({
            "query": query,
            "history": user_history or "None provided",
            "context": context_str,
            "format_instructions": self.parser.get_format_instructions()
        })

        return result
