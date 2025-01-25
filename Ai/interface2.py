import streamlit as st
import pymongo
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
import yaml
from yaml.loader import SafeLoader
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from RAG import return_rag_chain
from bson import ObjectId

user_icon = "icons/person.png"
bot_icon = "icons/bot.png"

def load_CSS():
    with open('static/style.css') as f:
        css = f"<style>{f.read()}</style>"
        st.markdown(css, unsafe_allow_html=True)

def open_chat(session_id: str):
    try:
        chat_with_history = MongoDBChatMessageHistory(
            session_id=session_id,
            connection_string=connection_string,
            database_name="flexdb",
            collection_name="history"
        )

        for message in chat_with_history.messages:
            div = f"""
            <div class="chat-row 
                {'' if isinstance(message, AIMessage) else 'row-reverse'}">
                <img class="chat-icon" src="app/static/{
                    'bot.png' if isinstance(message, AIMessage) 
                              else 'person.png'
                }"
                width="32" height="32"/>
                <div class="chat-bubble
                {'ai-bubble' if isinstance(message, AIMessage) else 'human-bubble'}">
                &#8203;{message.content}
                </div>
            </div>
            """
            st.markdown(div, unsafe_allow_html=True)

    except Exception as e:
        st.error(f"An error occurred: {str(e)}")
        return chat_with_history

    return chat_with_history



# Set up the page
st.set_page_config(page_title="🥦 Nutrition buddy 🤓!")
load_CSS()

# Set a default username (since login is removed)
query_params = st.experimental_get_query_params()
st.session_state.userid = query_params.get("userid", ["unknown"])[0]


@st.cache_resource
def get_rag_chain():
    return return_rag_chain()

rag_chain = get_rag_chain()
def load_sessions(userid):
    oid2 = ObjectId(userid)
    user = users_collection.find_one({"_id": oid2})
    st.session_state.username = user["username"]
    if user and "sessions" in user:
        return user["sessions"]  # Return the list of sessions
    return []
def load_user_info(userid):
    oid2 = ObjectId(userid)
    user = users_collection.find_one({"_id": oid2})
    user_answers = user["userAnswers"]
    print(user_answers)
    return user_answers
    info={}
def create_new_session(userid,username):
    # Generate a new session ID
    length = len(load_sessions(userid))
    session_id = f"{username}_session_{length + 1}"
    oid2 = ObjectId(userid)
    # Append the new session to the user's sessions list
    users_collection.update_one(
        {"_id": oid2},  # Filter by username
        {"$push": {"sessions": session_id}}  # Append the new session ID
    
    )
    if length == 0:
            user_info=load_user_info(userid)
            chat_with_history = MongoDBChatMessageHistory(
                session_id=session_id,
                connection_string=connection_string,
                database_name="flexdb",
                collection_name="history"
            )
            user_prompt = f"{user_info}generate me a wrokout plan for a 180 cm man who wants to lose weight"
            user_div = f"""
            <div class="chat-row row-reverse">
                <img class="chat-icon" src="app/static/person.png" width="32" height="32"/>
                <div class="chat-bubble human-bubble">
                &#8203;{user_prompt}
                </div>
            </div>
            """
            st.markdown(user_div, unsafe_allow_html=True)

            assistant_response = rag_chain.invoke({
                "input": user_prompt,
                "chat_history": chat_with_history.messages
            })['answer']

            chat_with_history.add_user_message(user_prompt)
            chat_with_history.add_ai_message(assistant_response)

            assistant_div = f"""
            <div class="chat-row">
                <img class="chat-icon" src="app/static/bot.png" width="32" height="32"/>
                <div class="chat-bubble ai-bubble">
                &#8203;{assistant_response}
                </div>
            </div>
            """
            st.markdown(assistant_div, unsafe_allow_html=True)

    
    return session_id

# Load MongoDB configuration from YAML
with open('config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)

# MongoDB connection
uri = f"mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.i2o3g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = pymongo.MongoClient(uri)
db = client['flexdb']
users_collection = db['users']
connection_string = uri
# Initialize session state
if 'current_session' not in st.session_state:
    st.session_state.current_session = None
st.session_state.sessions_list = load_sessions(st.session_state.userid)
if 'sessions_list' not in st.session_state:
    create_new_session(st.session_state.userid, st.session_state.username)
# Directly navigate to the Nutrition Buddy page
st.session_state.page = 'nutrition_buddy'

# Nutrition Buddy page
if st.session_state.page == 'nutrition_buddy':
    st.header("🥦 Nutrition buddy 🤓!")
    user = st.session_state.username

    with st.sidebar:
        st.write(f"Welcome, {user}!")

        st.markdown("-----")
        st.write("Session")
        if st.button("New Session", key="new_session_button"):  
            new_session_id = create_new_session( userid=st.session_state.userid,username=user)
            st.rerun()
        for session in st.session_state.sessions_list:
            if st.button(session, key=f"session_button_{session}"):
                st.session_state.current_session = session
                st.rerun()
    if st.session_state.current_session:
        chat_with_history = open_chat(st.session_state.current_session)
        

        if user_prompt := st.chat_input("Your message here", key="user_input"):
            user_div = f"""
            <div class="chat-row row-reverse">
                <img class="chat-icon" src="app/static/person.png" width="32" height="32"/>
                <div class="chat-bubble human-bubble">
                &#8203;{user_prompt}
                </div>
            </div>
            """
            st.markdown(user_div, unsafe_allow_html=True)

            assistant_response = rag_chain.invoke({
                "input": user_prompt,
                "chat_history": chat_with_history.messages
            })['answer']

            chat_with_history.add_user_message(user_prompt)
            chat_with_history.add_ai_message(assistant_response)

            assistant_div = f"""
            <div class="chat-row">
                <img class="chat-icon" src="app/static/bot.png" width="32" height="32"/>
                <div class="chat-bubble ai-bubble">
                &#8203;{assistant_response}
                </div>
            </div>
            """
            st.markdown(assistant_div, unsafe_allow_html=True)

            
            
    if "current_response" not in st.session_state:
        st.session_state.current_response = ""