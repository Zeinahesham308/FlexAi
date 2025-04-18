import { Component, OnInit } from '@angular/core';
import { ChatMessage, MessageStatus } from '../models/chatbot.messages.interface';
import { ChatService } from '../services/chat.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { ChatSession } from '../models/chat.session.interface';


@Component({
  selector: 'app-chatbot',
  standalone: false,

  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit {

  isSidebarVisible: boolean = false;    // Property to control sidebar visibility
  isBotTyping: boolean = false;         // Property to control typing indicator visibility

  messages: ChatMessage[] = [];
  inputMessage = ''; // Bind this to your textarea

  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  currentSessionId: string | null = null;
  errorMessage: string | null = null;


  private subscriptions: Subscription = new Subscription();


  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    this.loadSessions();;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.messages = []; //Explicit memory cleanup
  }

  // ==================== SESSION MANAGEMENT ====================

  loadSessions(): void {
    const sub = this.chatService.loadSessions().subscribe({
      next: (sessions: ChatSession[]) => {
        this.chatSessions = sessions;
        this.errorMessage = null;
      },
      error: (err: Error) => {
        this.errorMessage = 'Failed to load chat sessions';
        console.error('API Error:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  async loadChatSession(sessionId: string): Promise<void> {

    //if requested session is already loaded
    if (this.currentSessionId === sessionId) return;

    try {
      const sessionMessages = await lastValueFrom<ChatMessage[]>(
        this.chatService.getSessionMessages(sessionId)
      );
      this.currentSessionId = sessionId;
      this.messages = sessionMessages;
      this.errorMessage = null;
    } catch (error) {
      this.errorMessage = 'Failed to load chat session';
      console.error('API Error:', error);
    }
  }


  startNewChat(): void {
    const sub = this.chatService.startNewChat().subscribe({
      next: (newSession: ChatSession) => {
        this.currentSessionId = newSession.id;
        this.chatSessions = [newSession, ...this.chatSessions];
        this.messages = [];
        this.errorMessage = null;
      },
      error: (err: Error) => {
        this.errorMessage = 'Failed to start new chat';
        console.error('API Error:', err);
      }
    })
    this.subscriptions.add(sub);
  }




  // ==================== MESSAGE HANDLING ====================
  // Core message handling
  private addMessage(text: string, isBot: boolean, status?: MessageStatus): ChatMessage {
    const message = { text, isBot, status };
    this.messages = [...this.messages, message];
    return message;
  }
  private async getBotResponse(prompt: string): Promise<string> {
    this.isBotTyping = true;
    try {
      const response = await lastValueFrom(this.chatService.getBotResponse(prompt, this.currentSessionId!));
      return response.reply;
    } finally {
      this.isBotTyping = false;
    }
  }



  // ====================  USER ACTIONS ====================
  async sendMessage() {
    if (!this.inputMessage.trim()) return;

    const userMessage = this.addMessage(this.inputMessage, false, 'sending');
    this.inputMessage = '';

    try {

      const saveMsg = await lastValueFrom(
        this.chatService.addMessageToSession(
          this.currentSessionId!,
          userMessage

        )
      )
      const botReply = await this.getBotResponse(userMessage.text);
      // Update to 'sent' on success
      userMessage.status = 'sent';
      this.addMessage(botReply, true);
    }
    catch (error) {
      userMessage.status = 'failed';
      this.addMessage(this.handleError(error), true);
    }
  }

  async sendSuggestion(topic: string) {
    const userMessage = this.addMessage(`I need help with ${topic}`, false, 'sending');

    try {
      const botReply = await this.getBotResponse(topic);
      userMessage.status = 'sent';   // Update to 'sent' on success
      this.addMessage(botReply, true);
    } catch (error) {
      userMessage.status = 'failed';
      this.addMessage(this.handleError(error), true);
    }
  }

  // ==================== UI HELPERS ====================

  /* Toggle sidebar */
  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  // ==================== HELPERS ====================
  private handleError(error: any): string {
    console.error('API Error:', error);
    return error.status === 429
      ? "I'm getting too many requests. Please wait a moment..."
      : "Sorry, I'm having trouble connecting. Please try again.";
  }

  /**
 *  A function used by *ngFor to optimize rendering of chat sessions.
 * @param index The index of the current item in the iteration.
 * @param session  The ChatSession object in the current iteration.
 * @returns  The unique ID of the session to be used as the tracking identifier.
 */
  trackBySessionId(index: number, session: ChatSession): string {
    return session.id;
  }

}


