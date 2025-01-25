import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
    const baseUrl = 'https://ebc3-196-135-154-153.ngrok-free.app/';
    const rawUserData = localStorage.getItem('userData');
    if (rawUserData) {
      const userData = JSON.parse(rawUserData)
      const chatbotId = userData.chatbotId;
      this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}?userid=${chatbotId}`);
    }
    else {
      this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}`);
    }
  }
}
