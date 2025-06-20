from flask import Flask ,request,Response
import json
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from test_belal_1 import AGENT,MODIFY_PROMPT
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
    userid=json_content.get("agentId")
    cached = AGENT(sql_memory)
    goal=json_content.get("userAnswers").get("goal")
    weight=json_content.get("userAnswers").get("currentWeight")
    height=json_content.get("userAnswers").get("height")
    gender=json_content.get("userAnswers").get("gender")
    
    print("json_content received")
    print(json_content)
    config_id=json_content.get("config_id")
    
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
    
    config = {
    "recursion_limit": 99,
    "configurable": {
        "thread_id": userid,}}
    if len(cached.get_state(config).values)>3:
        
        state=cached.get_state(config).values
        
        final_plan=state["plan_model"][-1]
    
        
    else:
        print("no state found")
        state=cached.invoke(initial_state,config)
        json_response={"plan":state["plan_model"][-1].model_dump_json().replace("\\", "")}
        print("**********************************")
        
    return Response(final_plan.json())

@app.route("/ai/agent/change_exercise",methods=["POST"])
def agent_change():
    print("AGENT/ ai is called")

    json_content=request.json
    Old_exercise=json_content.get("exerciseToReplace")
    target_muscle=json_content.get("targetMusc")
    cached = AGENT(sql_memory)
    userid=json_content.get("agentId")
    config={"recursion_limit": 99,"configurable": {"thread_id": userid}}
    if len(cached.get_state(config).values)<1:
        return Response(json.dumps({"status":"error this user has no plan"}))
    print("traget muscle is ",target_muscle)
    print("old exercise is ",Old_exercise)
    saved_state=cached.get_state(config).values
    saved_plan=saved_state["plan_model"][-1].model_dump_json()
    print(saved_plan)
    formated_prompt=MODIFY_PROMPT.format(muscle_name=target_muscle,old_exercise_name=Old_exercise,full_plan=saved_plan)
    final_prompt=HumanMessage(content=formated_prompt)
    initial_state = {
    "messages": [final_prompt],
    
    }
    new_state=cached.invoke(initial_state,config)
    final_plan=new_state["plan_model"][-1].json()
    #reuren ok opreation is done
    return Response(final_plan)
@app.route("/", methods=["GET"])
def index():
    return "Server is running!"
def start_app():
    app.run(host="0.0.0.0",port=8080)
if __name__=="__main__":
    start_app()
    


    
