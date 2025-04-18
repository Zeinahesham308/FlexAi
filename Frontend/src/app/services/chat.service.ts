import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, Observable, throwError, timeout } from 'rxjs';
import { ChatSession } from '../models/chat.session.interface';
import { ChatMessage } from '../models/chatbot.messages.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = `${environment.baseUrl}/api/chat`;
  private readonly defaultTimeout = 15000; // 15 seconds



  constructor(private http: HttpClient) { }

  /**
   * Gets a bot response for the given prompt in specified session
   * @param prompt The user's message text
   * @param sessionId The ID of the chat session
   * @returns Observable containing the bot's reply
   */
  getBotResponse(prompt: string, sessionId: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      // TODO: UPDATE API
      `${this.baseUrl}/sessions/${sessionId}/bot-response`,
      { prompt }
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Creates a new chat session
   * @returns Observable containing the created session data
   */
  startNewChat(): Observable<ChatSession> {

    /* TODO: UPDATE API */
    return this.http.post<ChatSession>(`${this.baseUrl}/sessions`,
      { title: 'New Chat' }
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves all chat sessions for the current user
   * @returns Observable containing array of chat sessions
   */
  loadSessions(): Observable<ChatSession[]> {
    /* TODO: UPDATE API */
    return this.http.get<ChatSession[]>(
      `${this.baseUrl}/sessions`
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Gets all messages for a specific chat session
   * @param sessionId The ID of the chat session
   * @returns Observable containing array of chat messages
   */
  getSessionMessages(sessionId: string): Observable<ChatMessage[]> {
    /* TODO: UPDATE API */
    return this.http.get<ChatMessage[]>(
      `${this.baseUrl}/sessions/${sessionId}/messages`
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }


  /**
   * Adds a message to a chat session using the ChatMessage interface
   * @param sessionId The chat session ID
   * @param message The complete message
   */
  sendMessage(sessionId: string, message: ChatMessage): Observable<ChatMessage> {
    /* TODO: UPDATE API */
    return this.http.post<ChatMessage>(
      `${this.baseUrl}/sessions/${sessionId}/messages`,
      message
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  // ==================== MESSAGE MANAGEMENT ====================

  /**
   * Adds a message to a chat session
   * @param sessionId The chat session ID
   * @param message Complete ChatMessage object
   * @returns Observable with the same message (or enriched if needed)
   */
  addMessageToSession(
    sessionId: string,
    message: ChatMessage 
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      // TODO: UPDATE API
      `${this.baseUrl}/sessions/${sessionId}/messages`,
      message
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  // ==================== HELPERS ====================
  /**
   * Handles HTTP errors and converts to user-friendly messages
   * @param error The HTTP error response
   * @returns Throwable error with user-facing message
   * @private
   */
  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error(
      error.status === 429
        ? "Too many requests. Please wait..."
        : "Request failed. Please try again."
    ));

  }


  
}