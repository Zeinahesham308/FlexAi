import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, Observable, tap, throwError, timeout } from 'rxjs';
import { ChatSession } from '../models/chat.session.interface';
import { ChatMessage } from '../models/chatbot.messages.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.baseUrl}/api/chat`;
  private readonly defaultTimeout = 15000; // 15 seconds
  private currentSessionId: string | null = null; // Store current session ID



  constructor(private http: HttpClient) { }



  /**
   * Unified message handling - saves user message and gets bot reply in one call
   * @param prompt The user's message text
   * @param sessionId The ID of the chat session
   * @returns Observable with both saved user message and bot reply
   */
  getBotResponse(prompt: string, sessionId: string, userId: string): Observable<string> {
    return this.http.post<string>(
      // TODO: UPDATE API
      /* Save user message to session (using URL's sessionId) */
      `${this.apiUrl}/sessions/${sessionId}/messages`,
      { msg: prompt, userId: userId }
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
  startNewChat(userId: string): Observable<ChatSession> {

    return this.http.post<ChatSession>(`${this.apiUrl}/sessions`,
      { title: 'New Chat', userId: userId } // Pass userId to create session
    ).pipe(
      timeout(this.defaultTimeout),
      tap((session) => {
        /* Store the session ID for future use */
        if (!session || !session.sessionId) {
          throw new Error('Failed to create chat session');
        }
        this.currentSessionId = session.sessionId; // Store the session ID
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves all chat sessions for the current user
   * @returns Observable containing array of chat sessions
   */


  loadSessions(userId: string): Observable<ChatSession[]> {
    /* TODO: UPDATE API */
    return this.http.get<ChatSession[]>(
      `${this.apiUrl}/sessions/${userId}` //  API requires userId to fetch sessions
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
      `${this.apiUrl}/sessions/${sessionId}/messages`
    ).pipe(
      timeout(this.defaultTimeout),
      catchError(this.handleError)
    );
  }

  // A getter to retrieve the stored session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

 

  /* TODO: add delete session option */




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