# %%
# %%
from langchain_ollama import OllamaEmbeddings
from langchain_milvus import Milvus

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import os
from langchain_core.prompts import ChatPromptTemplate

from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.vectorstores import FAISS


from langchain_groq import ChatGroq
 

# %%

 
 
# %%

# load the local model 
#paraphrase-MiniLM-L6-v2 choose better one


# %%
def load_and_process_pdfs(pdf_folder_path):
    documents = []
    for file in os.listdir(pdf_folder_path):
        if file.endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder_path, file)
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2500, chunk_overlap=400)
    splits = text_splitter.split_documents(documents)
    return splits


# %%
from pymilvus import connections , utility ,db

def initialize_vectorstore(splits,embd):
    return FAISS.from_documents(documents=splits, embedding=embd)


 
def return_rag_chain( ):
    
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    splits = load_and_process_pdfs("nuitrions")
    vectorstore = initialize_vectorstore(splits,embeddings)
    

    print("Vectorstore created successfully")
    # %%
    os.environ["GROQ_API_KEY"] = "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"
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
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )
     
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    retriever = vectorstore.as_retriever(search_kwargs={"top_k": 17})  # Set top_k=5 here

    
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
        llm, retriever, contextualize_q_prompt
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
