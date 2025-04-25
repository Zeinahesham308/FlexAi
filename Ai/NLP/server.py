from flask import Flask ,request,Response
from RAG import return_rag_chain
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
import json
app = Flask(__name__)
cached_rag=return_rag_chain()
cached_History=InMemoryChatMessageHistory()
cached_chain=cached_rag.pick("answer")
@app.route("/ai",methods=["POST"])
def aiPost():
    print("Post / ai is called")
    json_content=request.json
    query=json_content.get("query")
    print(f"query: {query}")

    response = cached_chain.invoke({"input": query, "chat_history": cached_History.messages})
    json_response={"response":response}

    return Response(json.dumps(json_response))
    


def start_app():
    app.run(host="0.0.0.0",port=8080,debug=True)

if __name__=="__main__":
    start_app()


    