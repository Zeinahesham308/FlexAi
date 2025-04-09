import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {  Observable, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = `${environment.baseUrl}/chat`;
  private readonly defaultTimeout = 15000; // 15 seconds



  constructor(private http: HttpClient) { }

  getBotResponse(prompt: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(this.baseUrl, { prompt }).pipe(
      timeout(this.defaultTimeout)
    );
  }

}
