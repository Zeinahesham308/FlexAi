from flask import Flask ,request,Response
from RAG import return_rag_chain
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from yaml.loader import SafeLoader
import yaml
import json
with open('config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)
app = Flask(__name__)
cached_rag=return_rag_chain()
cached_chain=cached_rag.pick("answer")
@app.route("/ai",methods=["POST"])
def aiPost():
    print("Post / ai is called")
    json_content=request.json
    print("json_content: ",json_content)
    query=json_content.get("query")
    sessionid=json_content.get("sessionId")
    print(f"session_id: {sessionid}")
    cached_History=MongoDBChatMessageHistory(
        session_id=sessionid,
        
        connection_string=f"mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.7z7wzhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        
        database_name="flexdb",
        collection_name="history"
    )
    cached_History.add_user_message(query) 
    print(f"query: {query}")

    response = cached_chain.invoke({"input": query, "chat_history": cached_History.messages})
    json_response={"response":response}
    cached_History.add_ai_message(response)

    return Response(json.dumps(json_response))
    
@app.route("/ai/GetChatHistory",methods=["POST"])
def GetChatHistory():
    json_content=request.json
    sessionid=json_content.get("sessionId")
    print(f"session_id: {sessionid}")
    cached_History=MongoDBChatMessageHistory(
        session_id=sessionid,
        
        connection_string=f"mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.7z7wzhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        
        database_name="flexdb",
        collection_name="history"
    )
    messages=cached_History.messages
    serialized = [
    {"isBot": msg.type=="ai", "text": msg.content}
    for msg in messages
]
    json_response={"messages":serialized}
    return Response(json.dumps(json_response))
@app.route("/ai/GetSessionTitle",methods=["POST"])
def get_session_title():
    json_content=request.json
    sessionid=json_content.get("sessionId")
    print(f"session_id: {sessionid}")
    cached_History=MongoDBChatMessageHistory(
        session_id=sessionid,
        
        connection_string=f"mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.7z7wzhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        
        database_name="flexdb",
        collection_name="history"
    )
    title=cached_chain.invoke({"input": "generate session title for this conversation and return only the title", "chat_history": cached_History.messages})
    
    json_response={"messages":title}
    return Response(json.dumps(json_response))

@app.route("/health",methods=["GET"])
def index():
    return "Server is running!"
def start_app():
    app.run(host="0.0.0.0",port=8080)

if __name__=="__main__":
    start_app()


    