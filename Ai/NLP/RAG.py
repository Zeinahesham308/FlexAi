
from langchain_ollama import OllamaEmbeddings
from langchain_milvus import Milvus

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.tools import TavilySearchResults
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import TavilySearchAPIRetriever

import yaml
from yaml.loader import SafeLoader
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq

#update for bello
def load_and_process_pdfs(pdf_folder_path):
    documents = []
    for file in os.listdir(pdf_folder_path):
        if file.endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder_path, file)
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2500, chunk_overlap=400)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2500, chunk_overlap=400)
    splits = text_splitter.split_documents(documents)
    return splits


from pymilvus import connections , utility ,db
# add tavily search api retriever
# filter the context thats is retrieved
with open('config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)
def initialize_vectorstore(splits,embd):
    return FAISS.from_documents(documents=splits, embedding=embd)

 
def return_rag_chain( ):
    
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectorstore = FAISS.load_local("nuitrionsDB", embeddings,allow_dangerous_deserialization=True)
#     vectorstore = Milvus.from_documents(
#     documents=splits,
#     embedding=embeddings,
#     connection_args={
#        "uri": f"tcp://{config['milvus']['host']}:19530",  # Replace with the correct IP and port
#     },
#     collection_name="RAGCollection",    
#     drop_old=True,  # Drop the old Milvus collection if it exists
#  )
#     vectorstore = Milvus(
#   embeddings,
#     connection_args={
#         "uri": f"tcp://{config['milvus']['host']}:19530",  
#     },
#     collection_name="RAGCollection",    
# )
    

    print("Vectorstore created successfully")
    # %%
    os.environ["GROQ_API_KEY"] = config['groq']['apiKey']
    llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    
)

    # %%


    system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If the context provides a clear answer, prioritize it. "
    "If the context is incomplete or ambiguous, supplement it with your own knowledge, "
    "as long as your knowledge does not contradict the context. "
    "If you don't know the answer based on both the context and your knowledge, explicitly state that you don't know. "
    "Do not summarize unless explicitly requested or the question explicitly mentions summarization. "
    "Do not reference or mention the context explicitly in your answer. "
    "If the context is irrelevant to the question, answer based solely on your knowledge."
    "\n\n"
    "{context}"
)



    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", syst em_prompt),
            ("human", "{input}"),
        ]
    )
     
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    Faissretriever = vectorstore.as_retriever(search_kwargs={"top_k": 5})  # Set top_k=5 here
    os.environ["TAVILY_API_KEY"] = config['tavily']['apiKey']
    tavilyretriever = TavilySearchAPIRetriever(k=3)


    ensemble_retriever = EnsembleRetriever(retrievers=[Faissretriever,tavilyretriever])

    
    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    history_aware_retriever = create_history_aware_retriever(
        llm, ensemble_retriever, contextualize_q_prompt
    )
    
    
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    
    
    
    # %%
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    
    return rag_chain
