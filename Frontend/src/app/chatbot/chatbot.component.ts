import { Component } from '@angular/core';
import { ChatMessage, MessageStatus } from '../models/chatbot.messages.interface';
import { ChatService } from '../services/chat.service';
import { lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-chatbot',
  standalone: false,

  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {

  // Property to control sidebar visibility
  isSidebarVisible: boolean = false;

  // Property to control typing indicator visibility
  isBotTyping: boolean = false;
  messages: ChatMessage[] = [];
  inputMessage = ''; // Bind this to your textarea



  constructor(private chatService: ChatService) { }

  /* Toggle sidebar */
  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }


  // Core message handling
  private addMessage(text: string, isBot: boolean, status?: MessageStatus): ChatMessage {
    const message = { text, isBot, status };
    this.messages.push(message);
    return message;
  }
  private async getBotResponse(prompt: string): Promise<string> {
    this.isBotTyping = true;
    try {
      const response = await lastValueFrom(this.chatService.getBotResponse(prompt));
      return response.reply;
    } finally {
      this.isBotTyping = false;
    }
  }

  private handleError(error: any): string {
    console.error('API Error:', error);
    return error.status === 429
      ? "I'm getting too many requests. Please wait a moment..."
      : "Sorry, I'm having trouble connecting. Please try again.";
  }


  // User actions
  async sendMessage() {
    if (!this.inputMessage.trim()) return;

    const userMessage = this.addMessage(this.inputMessage, false, 'sending');
    this.inputMessage = '';

    try {
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

}


