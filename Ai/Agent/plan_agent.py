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
from langchain_openai import ChatOpenAI
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
WEIGHT:{weight}, HEIGHT:{tall}, GOAL:{goal}, INTENSITY:{intensity}, AGE:{age}, SEX:{sex}

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
agg_formatted_prompt=AGGREGATION_PROMPT.format(
    arm_plan=arm_p,
    back_plan=back_p,
    leg_plan=leg_p,
    shoulder_plan=shoulder_p,
    chest_plan=ches_p,
    weight=90,
    height=181,
    age=25,
    sex="male",
    goal="get lean muscle",
    intensity="high"
)
final_plan=llm_agg.invoke(agg_formatted_prompt).content
formatted=final_plan.replace("\\n", "\n")
print(formatted)

# %%
exercises_dict={"back":6,"chest":5,"legs":7,"shoulders":5,"arms":6}

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

llm_plan = llm_openai
llm_agg = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
llm_judge = llm_openai
llm=llm_plan.bind_tools(tools)

# %%
tool_node=ToolNode(tools)

# %%
openai_client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  
)

# %%
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

back_formatted_prompt = INITIAL_PROMPT.format(
    weight=90,
    tall=181, 
    goal="get lean muscle",
    sex="male",
    age=25,
    intensity="high",
    body_part="back",
    num_exercises=5
)
back_formatted_judge=JUDGE_PROMPT.format(body_part_name="BACK",expected_exercise_count=5)
arm_formatted_prompt = INITIAL_PROMPT.format(
    weight=90,
    tall=181,
    goal="get lean muscle",
    sex="male",
    age=25,
    intensity="high",
    body_part="arm",
    num_exercises=6
)
arm_formatted_judge=JUDGE_PROMPT.format(body_part_name="arm",expected_exercise_count=6)
leg_formatted_judge=JUDGE_PROMPT.format(body_part_name="leg",expected_exercise_count=7)
leg_formatted_prompt = INITIAL_PROMPT.format(
    weight=90,
    tall=181,
    goal="get lean muscle",
    sex="male",
    age=25,
    intensity="high",
    body_part="leg",
    num_exercises=7
)
shoulder_formatted_prompt = INITIAL_PROMPT.format(
    weight=90,
    tall=181,
    goal="get lean muscle",
    sex="male",
    age=25,
    intensity="high",
    body_part="shoulder",
    num_exercises=5
)
shoulder_formatted_judge=JUDGE_PROMPT.format(body_part_name="shoulder",expected_exercise_count=5)
chest_formatted_prompt = INITIAL_PROMPT.format(
    weight=90,
    tall=181,
    goal="get lean muscle",
    sex="male",
    age=25,
    intensity="high",
    body_part="chest",
    num_exercises=6
)
chest_formatted_judge=JUDGE_PROMPT.format(body_part_name="chest",expected_exercise_count=6)



# %%
config = {
    "recursion_limit": 70,
    "configurable": {
        "thread_id": 71,}}

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
    arm_plan:str
    back_plan:str
    leg_plan:str
    shoulder_plan:str
    chest_plan:str
    
    plan: str
    
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
    arm_input={"messages": [("user", arm_formatted_prompt)],"judge_prompt": arm_formatted_judge}
    arm_state=arm_agent.invoke(arm_input)
    print("ARM finished at:", time.time())
    return {"arm_plan": arm_state["plan"]}

def call_back(state: State_general):
    print("BACK started at:", time.time())
    back_input={"messages": [("user", back_formatted_prompt)],"judge_prompt": back_formatted_judge}
    back_state=back_agent.invoke(back_input)
    print("BACK finished at:", time.time())
    return {"back_plan": back_state["plan"]}
    
    
def call_leg(state: State_general):
    print("LEG started at:", time.time())
    leg_input={"messages": [("user", leg_formatted_prompt)],"judge_prompt": leg_formatted_judge}
    leg_state=leg_agent.invoke(leg_input)
    print("LEG finished at:", time.time())
    return {"leg_plan": leg_state["plan"]}

def call_shoulder(state: State_general):
    print("SHOULDER started at:", time.time())
    shoulder_input={"messages": [("user", shoulder_formatted_prompt)],"judge_prompt": shoulder_formatted_judge}
    shoulder_state=shoulder_agent.invoke(shoulder_input)
    print("SHOULDER finished at:", time.time())
    return {"shoulder_plan": shoulder_state["plan"]}

def call_chest(state: State_general):
    print("CHEST started at:", time.time())
    chest_input={"messages": [("user", chest_formatted_prompt)],"judge_prompt": chest_formatted_judge}
    chest_state=chest_agent.invoke(chest_input)
    print("CHEST finished at:", time.time())
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
    
def AGENT():

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

    workflow.add_edge("aggreagator", END)

    graph = workflow.compile(checkpointer=sql_memory)
    return graph

# %%
initial_state = {
    "messages": [],
    "arm_plan": "",
    "back_plan": "",
    "leg_plan": "",
    "shoulder_plan": "",
    "chest_plan": "",
    "summary_plan": ""
}


# %%
# # Invoke the graph with the initial state
# state_1=graph.invoke(initial_state,config)

# %%
import subprocess
import os

latex_code = r"""\documentclass{article}
\usepackage{amsmath}
\usepackage{amsfonts}
\usepackage{amssymb}
\usepackage{geometry}
\geometry{a4paper, margin=1in}
\begin{document}

\section*{5-Day Workout Plan}

\subsection*{Day 1: Chest and Triceps}
\begin{enumerate}
    \item \textbf{Barbell Bench Press}
    \begin{itemize}
        \item Primary: Pectoralis Major
        \item Secondary: Anterior Deltoids, Triceps
        \item Sets: 4
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Incline Dumbbell Press}
    \begin{itemize}
        \item Primary: Upper Pectoralis Major
        \item Secondary: Anterior Deltoids, Triceps
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
    \item \textbf{Triceps Rope Pushdown}
    \begin{itemize}
        \item Primary: Triceps Brachii
        \item Secondary: none
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
    \item \textbf{Skull Crushers}
    \begin{itemize}
        \item Primary: Triceps Brachii
        \item Secondary: none
        \item Sets: 3
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Triceps Dips}
    \begin{itemize}
        \item Primary: Triceps Brachii
        \item Secondary: Shoulders
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
\end{enumerate}

\subsection*{Day 2: Back and Biceps}
\begin{enumerate}
    \item \textbf{Bent-Over Barbell Rows}
    \begin{itemize}
        \item Primary: Latissimus Dorsi, Rhomboids, Trapezius, Lower Back, Middle Back
        \item Secondary: Abs, Biceps, Forearms, Upper Back
        \item Sets: 4
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Pull-Ups}
    \begin{itemize}
        \item Primary: Latissimus Dorsi
        \item Secondary: Biceps, Trapezius, Rhomboids, Shoulders, Forearms
        \item Sets: 3
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Lat Pulldowns}
    \begin{itemize}
        \item Primary: Latissimus Dorsi
        \item Secondary: Biceps, Rhomboids, Trapezius
        \item Sets: 3
        \item Reps: 10-12
    \end{itemize}
    \item \textbf{Dumbbell Bicep Curl}
    \begin{itemize}
        \item Primary: Biceps Brachii
        \item Secondary: Brachialis, Brachioradialis
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
\end{enumerate}

\subsection*{Day 3: Legs}
\begin{enumerate}
    \item \textbf{Back Squat}
    \begin{itemize}
        \item Primary: Quadriceps, Hamstrings, Glutes
        \item Secondary: Back, Core, Shoulders, Arms
        \item Sets: 4
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Deadlifts}
    \begin{itemize}
        \item Primary: Hamstrings, Glutes, Lower Back
        \item Secondary: Quadriceps, Core, Trapezius, Rhomboids
        \item Sets: 3
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Bulgarian Split Squat}
    \begin{itemize}
        \item Primary: Quadriceps, Glutes, Hamstrings
        \item Secondary: Hip Flexors
        \item Sets: 3
        \item Reps: 10-15 per leg
    \end{itemize}
    \item \textbf{Leg Extension}
    \begin{itemize}
        \item Primary: Quadriceps
        \item Secondary: none
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
    \item \textbf{Leg Curl}
    \begin{itemize}
        \item Primary: Hamstrings
        \item Secondary: none
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
    \item \textbf{Calf Raise}
    \begin{itemize}
        \item Primary: Gastrocnemius, Soleus
        \item Secondary: none
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
\end{enumerate}

\subsection*{Day 4: Shoulders and Abs}
\begin{enumerate}
    \item \textbf{Standing Military Press}
    \begin{itemize}
        \item Primary: Deltoids
        \item Secondary: Triceps, Core
        \item Sets: 4
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Front Raises}
    \begin{itemize}
        \item Primary: Anterior Deltoids
        \item Secondary: none
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
    \item \textbf{Lateral Raises}
    \begin{itemize}
        \item Primary: Deltoids
        \item Secondary: Trapezius, Shoulders
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
    \item \textbf{Reverse Fly}
    \begin{itemize}
        \item Primary: Rear Deltoids
        \item Secondary: Trapezius, Rhomboids
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
    \item \textbf{Russian Twists}
    \begin{itemize}
        \item Primary: Obliques
        \item Secondary: Core
        \item Sets: 3
        \item Reps: 12-15 per side
    \end{itemize}
    \item \textbf{Plank}
    \begin{itemize}
        \item Primary: Core
        \item Secondary: Shoulders, Back
        \item Sets: 3
        \item Hold: 30-60 seconds
    \end{itemize}
\end{enumerate}

\subsection*{Day 5: Arms}
\begin{enumerate}
    \item \textbf{Triceps Kickback}
    \begin{itemize}
        \item Primary: Triceps Brachii
        \item Secondary: none
        \item Sets: 3
        \item Reps: 12-15
    \end{itemize}
    \item \textbf{Close-Grip Bench Press}
    \begin{itemize}
        \item Primary: Triceps Brachii
        \item Secondary: Chest, Shoulders
        \item Sets: 3
        \item Reps: 8-12
    \end{itemize}
    \item \textbf{Hammer Curl}
    \begin{itemize}
        \item Primary: Biceps Brachii, Brachialis
        \item Secondary: Brachioradialis, Forearm muscles
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
    \item \textbf{Preacher Curl}
    \begin{itemize}
        \item Primary: Biceps Brachii
        \item Secondary: Brachialis
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
    \item \textbf{Incline Dumbbell Curl}
    \begin{itemize}
        \item Primary: Biceps Brachii
        \item Secondary: Brachialis, Brachioradialis
        \item Sets: 3
        \item Reps: 10-15
    \end{itemize}
\end{enumerate}

\end{document}
"""
with open("output2.tex", "w", encoding="utf-8") as f:
    f.write(latex_code)
import subprocess
import os
pdflatex_path = r"C:\Users\Hossa\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe"
try:
  
    print("Compiling LaTeX file...")
    result = subprocess.run([pdflatex_path, "output2.tex"], cwd=os.getcwd(), check=True, capture_output=True, text=True)
    print("LaTeX compilation successful.")
    print("pdflatex output:")
    print(result.stdout)
    if result.stderr:
        print("pdflatex errors/warnings:")
        print(result.stderr)

except FileNotFoundError:
    print(f"Error: pdflatex executable not found at '{pdflatex_path}'. Please check the path.")
except subprocess.CalledProcessError as e:
    print(f"Error during LaTeX compilation: {e}")
    print("pdflatex output:")
    print(e.stdout)
    print("pdflatex errors/warnings:")
    print(e.stderr)
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# %%
arm_p=state_1["messages"][-1].content
formatted = arm_p.replace("\\n", "\n")
print(formatted)

# %%
arm_p=state_1["arm_plan"]
formatted=arm_p.replace("\\n", "\n")
print(formatted)

# %%
back_p=state_1["back_plan"]
formatted=back_p.replace("\\n", "\n")
print(formatted)

# %%
leg_p=state_1["leg_plan"]
formatted=leg_p.replace("\\n", "\n")
print(formatted)

# %%
shoulder_p=state_1["shoulder_plan"]
formatted=shoulder_p.replace("\\n", "\n")
print(formatted)

# %%
ches_p=state_1["chest_plan"]
formatted=ches_p.replace("\\n", "\n")
print(formatted)

# %%
INTR

# %%
back_input={"messages": [("user", back_formatted_prompt)],"judge_prompt": back_formatted_judge}
back_state=back_agent.invoke(back_input,config)

# %%
back_state["plan"]


