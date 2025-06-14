# %%
import os

from IPython.display import Image, display
from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
import sqlite3
from langchain.tools import tool
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from yaml import load
from yaml import SafeLoader
from langgraph.prebuilt import ToolNode
from langchain_core.messages import ToolMessage
import json
from pydantic import BaseModel, Field
from typing import Annotated, Literal
#from langchain_openai import ChatOpenAI
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from openai import OpenAI
from typing_extensions import TypedDict
import openai
import time





# %%
conn_m=sqlite3.connect("state/agent_memory.db",check_same_thread=False)
sql_memory=SqliteSaver(conn_m)

# %%
INITIAL_PROMPT = """
Act as a fitness coach. Create a workout for ONE body part.
 Only call tools if there is a change or necessary so that the inital plan is form your own knowledge.
 User Data:
WEIGHT:{weight}, HEIGHT:{tall}, GOAL:{goal}, AGE:{age}, SEX:{sex}

Request:
TARGET BODY PART: {body_part}
TOTAL REQUIRED EXERCISES: {num_exercises}
Task:
1. Generate exactly {num_exercises} exercises for {body_part} based on user data.
2. CRITICAL: Ensure no two selected exercises target the exact same PRIMARY + SECONDARY muscle combination. Prioritize variety.
3. Output: List exercises: Name, Primary Muscle, Secondary Muscle(s), Sets, Reps (tailored to goal/intensity) only.
4. Ensure the exercises are not redundant.
5. Be concise but informative. Output should be clean and skimmable.

"""



# %%
JUDGE_PROMPT = """
You are a fitness session evaluator. Critically assess the workout session created for the target body part: **{body_part_name}**.

Your evaluation should focus on **diversity and variety**, avoiding any form of redundancy in exercises.

Review Criteria:

1. **Muscle Coverage**: Does each exercise clearly specify both a **primary** and **secondary** muscle group? Exercises missing this info are incomplete.

2. **Target diverse**: Are there any exercises that target the **same combination** of primary AND secondary muscles? This must be avoided — each exercise should provide a unique muscle activation pattern.

3. **Movement Redundancy**: Are there exercises that use the same or very similar **movement patterns** (e.g., multiple curls, rows, presses)? If multiple exercises perform the same type of motion or hit muscles in the same way, it reduces session effectiveness. Prioritize biomechanical variety.

Your goal is to ensure:
- No **duplicate** or **functionally redundant** exercises
- Every exercise adds unique **value** to the session
- The plan is **diverse and well-balanced**

===
Target Body Part: {body_part_name}  
Expected Exercise Count: {expected_exercise_count}
===
"""


# %%
AGGREGATION_PROMPT = """
You are a fitness expert AI.

Your task is to combine multiple individual workout plans (each targeting a BODY PART ) into a well-organized and cohesive full workout program summary. This should read like a structured, easy-to-follow weekly plan or daily split routine.

User Data:
- Weight: {weight} kg
- Height: {height} cm
- Age: {age}
- Sex: {sex}
- Goal: {goal}
- Intensity: {intensity}

Individual Muscle Group Plans:
- Arm Plan: {arm_plan}
- Back Plan: {back_plan}
- Leg Plan: {leg_plan}
- Shoulder Plan: {shoulder_plan}
- Chest Plan: {chest_plan}

Instructions:
1.  **Weekly Structure (5-Day PPL Split):**
    Organize the combined plans into the following 5-day PPL split. Days 4 and 7 are implicitly rest days;  divide the push exercises into two days: Day 1 and Day 5 and the pull exercises into Day 2 and Day 6.
     **Day 1: Push Workout**
     **Day 2: Pull Workout**
     **Day 3: Leg Workout**
     **Day 4: Rest Day**
     **Day 5: Push  Workout**
     **Day 6: Pull  Workout**
     **Day 7: Rest Day**
3. DIVIDE THE PUSH INTO TWO DAYS:
    - Day 1: Push  Workout
    - Day 5: Push  Workout
4. DIVIDE THE PULL INTO TWO DAYS:
    - Day 2: Pull  Workout
    - Day 6: Pull  Workout

5. Combine all muscle group plans into a 5 DAY weekly workout routine.
6. Clearly indicate each day
7. Be concise but informative. Output should be clean 

Output:
A complete weekly training schedule summarizing the user’s personalized workout plan.
"""
## make different aggregation prompt for every day count


# %%
exercises_dict={"back":6,"chest":5,"legs":7,"shoulders":5,"arms":6}
class Feedback(BaseModel):
    grade:Literal["good","bad"]
    feedback: str=Field("if the workout is not good provide feedback on how to improve it")
evaluator=llm_judge.with_structured_output(Feedback)

class State(TypedDict):
    messages: Annotated[list,add_messages]
    feedback: str
    judge_prompt: str
    grade: str
    plan:str
    summary_plan: str

# %%
def print_stream(stream):
    for s in stream:
        message = s["messages"][-1]
        message.pretty_print()

# %%
config = load(open("config.yaml"), Loader=SafeLoader)
os.environ["GROQ_API_KEY"] = config["groq"]["apiKey"]
os.environ["OPENAI_API_KEY"] = config["openai"]["apiKey"]
llm_openai=ChatOpenAI(temperature=0, model_name="gpt-4.1")

# %%
connection = sqlite3.connect("work_out.db")
@tool
def get_exercises(body_part: str, primary_muscles: str, secondary_muscles: str,exercises_number:int=2) -> list:
    """
    Fetches exercises from the SQLite database based on primary and sub muscle.

    Args:
        body_part (str): The body part to filter exercises by Body parts: Back, Chest, Leg, Shoulders, Arms.
        primary_muscles (str): Primary muscle group targeted.
        secondary_muscle (str): Secondary muscle group targeted.
        exercises_number (int): Number of exercises to fetch (default is 2) change if you need more results.
    
    Returns:
        str: A formatted string listing matching exercises, one per line.
    """
    primary_muscles = primary_muscles.lower().strip()
    secondary_muscles = secondary_muscles.lower().strip()
    body_part = body_part.lower().strip()
    body_part_modified = body_part[:-1] if body_part.endswith('s') else body_part

    connection = sqlite3.connect("work_out.db")
    cursor = connection.cursor()
    query = f"""
        SELECT exercise,primary_muscles,secondary_muscles 
        FROM DATASET
        WHERE (primary_muscles LIKE '%{primary_muscles}%' 
               or secondary_muscles LIKE '%{secondary_muscles}%')
        AND body_part = '{body_part_modified}'
        LIMIT {exercises_number};
    """
    parameters = (f"%{primary_muscles}%", f"%{secondary_muscles}%", body_part_modified)
    cursor.execute(query)
    rows = cursor.fetchall()
    connection.close()
    if not rows:
        return "no exercises found"
    exercise_details = []
    for i, (name, prim, sec) in enumerate(rows, 1):
        name_str = str(name).strip() if name else "Unknown Exercise"
        prim_str = str(prim).strip() if prim else "N/A"
        sec_str = str(sec).strip() if sec else "N/A" 
        exercise_details.append(
            f"{i}. {name_str}\n   Primary: {prim_str}\n   Secondary: {sec_str}"
        )
    formatted_output = "\n ".join(exercise_details)
    return f"Found these exercises:\n{formatted_output}"
    
    


# %%
tools=[get_exercises]

# %%


llm_agg = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
llm_plan = llm_openai
llm_judge = llm_openai
llm=llm_plan.bind_tools(tools)

# %%
tool_node=ToolNode(tools)

# %%
from pydantic import BaseModel,Field
from typing import List

class Exercise(BaseModel):
    name: str =Field(description="Name of the exercise")
    sets: int
    reps: str  # Use str if reps like "8-12"

class DayPlan(BaseModel):
    day: str
    exercises: List[Exercise]

class WeeklyPlan(BaseModel):
    plan: List[DayPlan]



# %%

# back_formatted_prompt = INITIAL_PROMPT.format(
#     weight=90,
#     tall=181, 
#     goal="get lean muscle",
#     sex="male",
#     age=25,
#     intensity="high",
#     body_part="back",
#     num_exercises=5
# )
# back_formatted_judge=JUDGE_PROMPT.format(body_part_name="BACK",expected_exercise_count=5)

# arm_formatted_judge=JUDGE_PROMPT.format(body_part_name="arm",expected_exercise_count=6)
# leg_formatted_judge=JUDGE_PROMPT.format(body_part_name="leg",expected_exercise_count=7)
# leg_formatted_prompt = INITIAL_PROMPT.format(
#     weight=90,
#     tall=181,
#     goal="get lean muscle",
#     sex="male",
#     age=25,
#     intensity="high",
#     body_part="leg",
#     num_exercises=7
# )
# shoulder_formatted_prompt = INITIAL_PROMPT.format(
#     weight=90,
#     tall=181,
#     goal="get lean muscle",
#     sex="male",
#     age=25,
#     intensity="high",
#     body_part="shoulder",
#     num_exercises=5
# )
# shoulder_formatted_judge=JUDGE_PROMPT.format(body_part_name="shoulder",expected_exercise_count=5)
# chest_formatted_prompt = INITIAL_PROMPT.format(
#     weight=90,
#     tall=181,
#     goal="get lean muscle",
#     sex="male",
#     age=25,
#     intensity="high",
#     body_part="chest",
#     num_exercises=6
# )
# chest_formatted_judge=JUDGE_PROMPT.format(body_part_name="chest",expected_exercise_count=6)



# %%
config = {
    "recursion_limit": 70,
    "configurable": {
        "thread_id": 78,}}

# %%
from pydantic import BaseModel, Field
from typing import List, Optional, Union

# Pydantic Models for Fitness Plan Structure
class Exercise(BaseModel):
    name: str = Field(description="Name of the exercise")
    sets: int = Field(default=None, description="Number of sets")
    reps:str = Field(default=None, description="Number of reps or rep range")
    
class WorkoutDay(BaseModel):
    day: str = Field(description="Day of the week or day number")
    focus: Optional[str] = Field(default=None, description=" workout focus wether push or pull etc") 
    exercises: List[Exercise] = Field(description="List of exercises for this day")

class FitnessPlan(BaseModel):
    workout_days: List[WorkoutDay] = Field(description="List of workout days")
   

# %%

    
def should_continue(state: State) -> Literal["tools", "judger",END]:  
    messages = state["messages"]
    last_message = messages[-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    if state.get("grade") == "good":
        return END
    else:
        return "judger"


def call_model(state: State):
    messages = state["messages"]
    for i, msg in enumerate(messages):
        if isinstance(msg, ToolMessage) and not isinstance(msg.content, str):
            messages[i] = ToolMessage(
                tool_call_id=msg.tool_call_id,
                content=json.dumps(msg.content)
            )
    response = llm.invoke(messages)
    return {"messages": [response]}

def call_judge(state:State):
    plan=state["messages"][-1].content
    judge_message=state["judge_prompt"]
    response=evaluator.invoke(judge_message+plan)
    print("**********************************************************************")
    feddback_message=HumanMessage(content=response.feedback)
    print(response.grade)
    return {
        "plan": plan,
        "messages": feddback_message,
        "feedback": response.feedback,
          "grade": response.grade
      }
back_agent = StateGraph(State)
back_agent.add_node("agent", call_model)
back_agent.add_node("tools", tool_node)
back_agent.add_node("judger", call_judge)
back_agent.add_edge(START, "agent")
back_agent.add_conditional_edges("agent", should_continue)
back_agent.add_edge("judger", "agent")

back_agent.add_edge("tools", "agent")

back_agent = back_agent.compile(checkpointer=MemorySaver())


# %%

#display(Image(back_agent.get_graph(xray=1).draw_mermaid_png()))


# %%

 

arm_agent = StateGraph(State)
arm_agent.add_node("agent", call_model)
arm_agent.add_node("tools", tool_node)
arm_agent.add_node("judger", call_judge)
arm_agent.add_edge(START, "agent")
arm_agent.add_conditional_edges("agent", should_continue)
arm_agent.add_edge("judger", "agent")

arm_agent.add_edge("tools", "agent")
#workflow.add_edge("summary", END)
arm_agent = arm_agent.compile(checkpointer=MemorySaver())

#display(Image(arm_agent.get_graph(xray=1).draw_mermaid_png()))

# %%


leg_agent = StateGraph(State)
leg_agent.add_node("agent", call_model)
leg_agent.add_node("tools", tool_node)
leg_agent.add_node("judger", call_judge)
leg_agent.add_edge(START, "agent")
leg_agent.add_conditional_edges("agent", should_continue)
leg_agent.add_edge("judger", "agent")

leg_agent.add_edge("tools", "agent")
#workflow.add_edge("summary", END)

leg_agent = leg_agent.compile(checkpointer=MemorySaver())


# %%


shoulder_agent = StateGraph(State)
shoulder_agent.add_node("agent", call_model)
shoulder_agent.add_node("tools", tool_node)
shoulder_agent.add_node("judger", call_judge)
shoulder_agent.add_edge(START, "agent")
shoulder_agent.add_conditional_edges("agent", should_continue)
shoulder_agent.add_edge("judger", "agent")
shoulder_agent.add_edge("tools", "agent")
#workflow.add_edge("summary", END)

shoulder_agent = shoulder_agent.compile(checkpointer=MemorySaver())


# %%


chest_agent = StateGraph(State)
chest_agent.add_node("agent", call_model)
chest_agent.add_node("tools", tool_node)
chest_agent.add_node("judger", call_judge)
chest_agent.add_edge(START, "agent")
chest_agent.add_conditional_edges("agent", should_continue)
chest_agent.add_edge("judger", "agent")
chest_agent.add_edge("tools", "agent")
#workflow.add_edge("summary", END)

chest_agent = chest_agent.compile(checkpointer=MemorySaver())


# %%

class State_general(TypedDict):
    messages: Annotated[list,add_messages]
    goal:str
    height:str
    weight:str
    age:str
    gender:str
    
    arm_plan:str
    back_plan:str
    leg_plan:str
    shoulder_plan:str
    chest_plan:str
    plan: str
    plan_model:str
    
def should_continue_g(state: State_general) -> Literal["tools", "caller",END]: 
    
    messages = state["messages"]
    if messages:
        last_message = messages[-1]
    else:
        last_message = None
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    if len(state["messages"])==0:
        return "caller"
    else:
        return END

    
def call_model_g(state: State_general):
    messages = state["messages"]
    if len(messages) ==0:
        return
    for i, msg in enumerate(messages):
        if isinstance(msg, ToolMessage) and not isinstance(msg.content, str):
            messages[i] = ToolMessage(
                tool_call_id=msg.tool_call_id,
                content=json.dumps(msg.content)
            )
    response = llm.invoke(messages)
    return {"messages": [response]}
    


def caller_f (state: State_general):
    return 
def call_arm(state: State_general):
    print("ARM started at:", time.time())
    
    arm_input={"messages": [("user", INITIAL_PROMPT.format(weight=state["weight"],tall=state["height"],goal=state["goal"],sex=state["gender"],age=state["age"],body_part="arm",num_exercises=6))],"judge_prompt": JUDGE_PROMPT.format(body_part_name="arm",expected_exercise_count=6)}
    arm_state=arm_agent.invoke(arm_input)
    print("ARM finished at:", time.time())
    return {"arm_plan": arm_state["plan"]}

def call_back(state: State_general):
    print("BACK started at:", time.time())
    back_input={"messages": [("user", INITIAL_PROMPT.format(weight=state["weight"],tall=state["height"],goal=state["goal"],sex=state["gender"],age=state["age"],body_part="back",num_exercises=5))],"judge_prompt": JUDGE_PROMPT.format(body_part_name="back",expected_exercise_count=5)}
    back_state=back_agent.invoke(back_input)
    print("BACK finished at:", time.time())
    return {"back_plan": back_state["plan"]}
    
    
def call_leg(state: State_general):
    leg_input={"messages": [("user", INITIAL_PROMPT.format(weight=state["weight"],tall=state["height"],goal=state["goal"],sex=state["gender"],age=state["age"],body_part="leg",num_exercises=7))], "judge_prompt": JUDGE_PROMPT.format(body_part_name="leg",expected_exercise_count=7)}
    leg_state=leg_agent.invoke(leg_input)
    return {"leg_plan": leg_state["plan"]}
def call_shoulder(state: State_general):
    shoulder_input={"messages": [("user", INITIAL_PROMPT.format(weight=state["weight"],tall=state["height"],goal=state["goal"],sex=state["gender"],age=state["age"],body_part="shoulders",num_exercises=5))],"judge_prompt": JUDGE_PROMPT.format(body_part_name="shoulders",expected_exercise_count=5)}
    shoulder_state=shoulder_agent.invoke(shoulder_input)
    return {"shoulder_plan": shoulder_state["plan"]}

def call_chest(state: State_general):
    print("CHEST started at:", time.time())
    chest_input={"messages": [("user", INITIAL_PROMPT.format(weight=state["weight"],tall=state["height"],goal=state["goal"],sex=state["gender"],age=state["age"],body_part="chest",num_exercises=6))],"judge_prompt": JUDGE_PROMPT.format(body_part_name="chest",expected_exercise_count=6)}
    chest_state=chest_agent.invoke(chest_input)
    return {"chest_plan": chest_state["plan"]}
def aggregate(state: State_general):
    print("you are in aggregate ")
    agg_formatted_prompt=AGGREGATION_PROMPT.format(
        arm_plan=state["arm_plan"],
        back_plan=state["back_plan"],
        leg_plan=state["leg_plan"],
        shoulder_plan=state["shoulder_plan"],
        chest_plan=state["chest_plan"],
        weight=90,
        height=181,
        age=25,
        sex="male",
        goal="get lean muscle",
        intensity="high"
    )

    final_plan=llm_agg.invoke(agg_formatted_prompt).content
    temp_1=AIMessage(final_plan)
    return {
        "messages":[temp_1],
        "plan": final_plan
    }
def jsonize(state: State_general):
    print("you are in jsonizer")
    llm_j=llm_openai.with_structured_output(WeeklyPlan)
    fitness_plan=llm_j.invoke(state["plan"])
    return {"plan_model": fitness_plan}

def AGENT(sql_controller):

    workflow = StateGraph(State_general)

    workflow.add_node("aggreagator", aggregate)
    workflow.add_node("back", call_back)
    workflow.add_node("arm", call_arm)
    workflow.add_node("leg", call_leg)
    workflow.add_node("shoulder", call_shoulder)
    workflow.add_node("chest", call_chest)
    workflow.add_node("caller", caller_f)  
    workflow.add_node("agent", call_model_g)
    workflow.add_node("tools", tool_node)
    workflow.add_node("jsonizer", jsonize)
    workflow.add_edge(START, "agent")  
    workflow.add_conditional_edges("agent", should_continue_g)
    workflow.add_edge("caller", "back")
    workflow.add_edge("caller", "arm")
    workflow.add_edge("caller", "leg")
    workflow.add_edge("caller", "shoulder")
    workflow.add_edge("caller", "chest")

    workflow.add_edge("leg", "aggreagator")
    workflow.add_edge("shoulder", "aggreagator")
    workflow.add_edge("chest", "aggreagator")
    workflow.add_edge("back", "aggreagator")
    workflow.add_edge("arm", "aggreagator")
    workflow.add_edge("tools", "agent")
    workflow.add_edge("aggreagator", "jsonizer")
    workflow.add_edge("jsonizer", END)
    graph = workflow.compile(checkpointer=sql_controller)
    return graph

# %%
graph=AGENT(sql_memory)



