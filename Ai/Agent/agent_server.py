#from test_belal_1 import AGENT  
from flask import Flask ,request,Response
import json
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
conn_m=sqlite3.connect("state/agent_memory.db",check_same_thread=False)
sql_memory=SqliteSaver(conn_m)
app = Flask(__name__)
# cached_agent=AGENT(sql_memory)


@app.route("/ai/agent",methods=["POST"])
def aiPost():
    print("Post / ai is called")
    json_content=request.json
    query=json_content.get("query")
    userid=json_content.get("userAnswers")
    print("json_content: ",json_content)
    config_id=json_content.get("config_id")
    if query:
        initial_state = {
    "messages": [HumanMessage(content=query)],
    "arm_plan": "",
    "back_plan": "",
    "leg_plan": "",
    "shoulder_plan": "",
    "chest_plan": "",
    "summary_plan": ""} 
    else:
        initial_state = {
        "messages": [],
        "arm_plan": "",
        "back_plan": "",
        "leg_plan": "",
        "shoulder_plan": "",
        "chest_plan": "",
        "summary_plan": ""
}   
    config = {
    "recursion_limit": 70,
    "configurable": {
        "thread_id": config_id,}}

    print("the agent is invoked")
    json_response={"hello":"hello"}
    return Response(json.dumps(json_response))
    


def start_app():
    app.run(host="0.0.0.0",port=8080,debug=True)

if __name__=="__main__":
    start_app()


    
