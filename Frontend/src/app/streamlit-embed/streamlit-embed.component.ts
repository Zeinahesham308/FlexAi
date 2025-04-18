import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-streamlit-embed',
  standalone: false,

  templateUrl: './streamlit-embed.component.html',
  styleUrl: './streamlit-embed.component.scss'
})
export class StreamlitEmbedComponent implements OnInit {

  constructor(private sanitizer: DomSanitizer) { }


  chatbotUrl!: SafeResourceUrl;
  ngOnInit(): void {
    const baseUrl = 'https://077f-102-41-110-135.ngrok-free.app';
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

