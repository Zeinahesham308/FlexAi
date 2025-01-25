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
            database_name="nutrition_buddy",
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

def load_sessions(username):
    sessions = db["sessions"].find({"username": username})
    return [session["session_id"] for session in sessions]

def create_new_session(username):
    session_id = f"{username}_session_{len(load_sessions(username)) + 1}"
    db["sessions"].insert_one({"username": username, "session_id": session_id})
    return session_id

# Set up the page
st.set_page_config(page_title="🥦 Nutrition buddy 🤓!")
load_CSS()

# Set a default username (since login is removed)
st.session_state.username = "default_user"

@st.cache_resource
def get_rag_chain():
    return return_rag_chain()

rag_chain = get_rag_chain()

# Load MongoDB configuration from YAML
with open('config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)

# MongoDB connection
uri = f"mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.i2o3g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = pymongo.MongoClient(uri)
db = client['test']
users_collection = db['users']
connection_string = uri

# Initialize session state
if 'current_session' not in st.session_state:
    st.session_state.current_session = None
if 'sessions_list' not in st.session_state:
    st.session_state.sessions_list = []

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
            new_session_id = create_new_session(user)
            st.session_state.sessions_list.append(new_session_id)
            st.session_state.current_session = new_session_id
            st.rerun()
        for session in st.session_state.sessions_list:
            if st.button(session, key=f"session_button_{session}"):
                st.session_state.current_session = session
                st.rerun()

    if st.session_state.current_session:
        chat_with_history = open_chat(st.session_state.current_session)
        if chat_with_history is None:
            chat_with_history = MongoDBChatMessageHistory(
                session_id=st.session_state.current_session,
                connection_string=uri,
                database_name="test",
                collection_name="history"
            )

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