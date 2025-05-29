from plan_agent import AGENT_2  
from flask import Flask ,request,Response
import json
app = Flask(__name__)
cached_agent=AGENT_2()


@app.route("/ai/agent",methods=["POST"])
def aiPost():
    print("Post / ai is called")
    json_content=request.json
    query=json_content.get("query")
    config_id=json_content.get("config_id")
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

    response = cached_agent.invoke(initial_state,config)
    print("the agent is invoked")
    json_response={"plan":response["plan"]}
    return Response(json.dumps(json_response))
    


def start_app():
    app.run(host="0.0.0.0",port=8080,debug=True)

if __name__=="__main__":
    start_app()


    
