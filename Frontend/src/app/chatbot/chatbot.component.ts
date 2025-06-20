import { Component, OnInit } from '@angular/core';
import { ChatMessage, MessageStatus } from '../models/chatbot.messages.interface';
import { ChatService } from '../services/chat.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { ChatSession } from '../models/chat.session.interface';
import { AuthService } from '../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';


@Component({
  selector: 'app-chatbot',
  standalone: false,

  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit {

  isSidebarVisible: boolean = false;    // Property to control sidebar visibility
  isBotTyping: boolean = false;         // Property to control typing indicator visibility

  /* messages: ChatMessage[] = []; */
 messages: ChatMessage[] = [
  // Basic user message (plain text)
  {
    text: 'Hello, I need some help with my account.',
    isBot: false,
    status: 'sent'
  },

  // Simple bot response with basic Markdown
  {
    text: '**Sure!** How can I assist you with your account today?',
    isBot: true,
    status: 'sent'
  },

  // User message with special characters
  {
    text: 'I can\'t log in - it says "invalid credentials"',
    isBot: false,
    status: 'sent'
  },

  // Bot message with Markdown list
  {
    text: 'Try these steps:\n\n1. Check your **caps lock**\n2. Reset your password\n3. Clear browser cookies\n\n`Or contact support`',
    isBot: true,
    status: 'sent'
  },

  // Message with sending status
  {
    text: 'Checking our knowledge base...',
    isBot: true,
    status: 'sending'
  },

  // Failed message
  {
    text: 'Failed to connect to server',
    isBot: true,
    status: 'failed'
  },

  // Complex Markdown with multiple elements
  {
    text: '## Account Recovery\n\n**Options:**\n\n- Email reset\n- Security questions\n- [Help center](https://help.example.com)\n\n```\nfunction resetAccount(email) {\n  // Account recovery logic\n}\n```\n\n> Note: Process may take 5-10 minutes',
    isBot: true,
    status: 'sent'
  },

  // Edge case - empty message
  {
    text: '',
    isBot: false,
    status: 'sent'
  },

  // Edge case - only Markdown symbols
  {
    text: '**_** ` `',
    isBot: true,
    status: 'sent'
  },

  // Very long message
  {
    text: 'This is an extremely long message designed to test text wrapping and overflow handling. It contains many sentences to ensure the layout remains consistent. **Markdown elements** like *italics* and `code snippets` should work properly even in lengthy content. ```\nLong code examples should scroll\nif they exceed container width\n``` List items:\n- Item 1\n- Item 2\n- Item 3',
    isBot: true,
    status: 'sent'
  },

  // Mixed content message
  {
    text: 'Normal text **bold text** normal *italic* text\n- List item\n- Another item\n\n`code()` and [link](https://example.com)',
    isBot: true,
    status: 'sent'
  },

  // Message that looks like Markdown but isn't (user message)
  {
    text: 'Should display *literally* not in italics',
    isBot: false,
    status: 'sent'
  },

  // Bot message with table-like Markdown
  {
    text: '| Feature | Status |\n|---------|--------|\n| Login   | ✅     |\n| Signup  | ⚠️     |',
    isBot: true,
    status: 'sent'
  }
];
  inputMessage = ''; // Bind this to your textarea

  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  currentSessionId: string | null = null;
  errorMessage: string | null = null;

  userId!: string; // Store user ID

  private subscriptions: Subscription = new Subscription();


  constructor(private chatService: ChatService, private authService: AuthService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.loadSessions();
    // Get user id
    this.userId=this.authService.getStoredUserId();
    this.userId = "6851e180fcc1b73d7a23876f";
    this.startNewChat(); // Start a new chat session on component initialization

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.messages = []; //Explicit memory cleanup
  }

  // ==================== SESSION MANAGEMENT ====================

  loadSessions(): void {
    const sub = this.chatService.loadSessions(this.userId).subscribe({
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
    const sub = this.chatService.startNewChat(this.userId).subscribe({
      next: (newSession: ChatSession) => {
        this.currentSessionId = newSession.sessionId;
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
  private async getBotResponse(prompt: string): Promise<ChatMessage> {
    this.isBotTyping = true;
    try {
      const replyText = await lastValueFrom(this.chatService.getBotResponse(prompt, this.currentSessionId!, this.userId));

      const textToSend= replyText.data.message; // Extract the message text from the response
      return {
        text: textToSend,
        isBot: true,
      };
    } finally {
      this.isBotTyping = false;
    }
  }



  // ====================  USER ACTIONS ====================
  async sendMessage() {
    if (!this.inputMessage.trim()) return;

    const userMessage = this.addMessage(this.inputMessage, false, 'sending');

    // Clear the input field
    this.inputMessage = '';

    try {

      const botReply: ChatMessage = await
        this.getBotResponse(userMessage.text);

      userMessage.status = 'sent'; // Update to 'sent' on success
      this.addMessage(botReply.text, true); // Add the bot reply to the messages array


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
      this.addMessage(botReply.text, true);
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
    return session.sessionId;
  }

   // Method to safely render HTML
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}

