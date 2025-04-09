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
export class ChatbotComponent implements OnInit {

  constructor(private sanitizer: DomSanitizer) {}


  chatbotUrl!: SafeResourceUrl;
  ngOnInit(): void {
    const baseUrl = 'https://077f-102-41-110-135.ngrok-free.app';
    const rawUserData = localStorage.getItem('userData');
    if (rawUserData) {
      const userData = JSON.parse(rawUserData)
      const chatbotId = userData.chatbotId;
      this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}?userid=${chatbotId}`);
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


