from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage , AIMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
import yaml
from yaml.loader import SafeLoader
from RAG import return_rag_chain

from elevenlabs.client import ElevenLabs
from elevenlabs import play
import os
with open('config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)
elevenlabs_api_key = config['elevnlabs']['apiKey']
client = ElevenLabs(api_key=elevenlabs_api_key)
rag=return_rag_chain()
while True:
    question = input("Ask a question: ")
    response = rag.invoke({"input": question, "chat_history": []})["answer"]
    print(response)

    audio = client.text_to_speech.convert(
        text=response,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_flash_v2",
        output_format="mp3_44100_128",
    )
    play(audio)
    if question == "exit":
        break


