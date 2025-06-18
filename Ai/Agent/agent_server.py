from flask import Flask ,request,Response
import json
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from test_belal_1 import AGENT
conn_m=sqlite3.connect("state/agent_memory_server.sqlite",check_same_thread=False)
sql_memory=SqliteSaver(conn_m)
app = Flask(__name__)
# cached_agent=AGENT(sql_memory)
## we need session so we dont call the model every time

@app.route("/ai/agent",methods=["POST"])
def aiPost():
    print("AGENT/ ai is called")
    json_content=request.json
    query=json_content.get("query")
    userid=json_content.get("userid")
    cached = AGENT(sql_memory)
    goal=json_content.get("userAnswers").get("goal")
    weight=json_content.get("userAnswers").get("currentWeight")
    height=json_content.get("userAnswers").get("height")
    gender=json_content.get("userAnswers").get("gender")
    
    print("json_content received")
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
    "summary_plan": "",
    "goal": goal,
    "weight": weight,
    "height": height,
    "age":"25",
    "gender": gender,
    "plan_model":""
    
}  
         
    print("initial state is created")
    print("user id is",int(userid)+71)
    config = {
    "recursion_limit": 99,
    "configurable": {
        "thread_id": int(userid),}}
    state=cached.invoke(initial_state,config)
    #state=cached.get_state(config).state
    print("the state type is",type(state))
    print("the agent is invoked")
    json_response={"plan":state["plan_model"].model_dump_json()}
    print("the size of response is ",len(state["arm_plan"]))
    print("the type of response is ",type(state["plan_model"]))
    return Response(json.dumps(json_response))
    


def start_app():
    app.run(host="0.0.0.0",port=8080,debug=True)

if __name__=="__main__":
    start_app()


    
