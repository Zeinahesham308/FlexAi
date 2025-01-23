import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserAnswers } from '../models/user-answers';
import { catchError, Observable, throwError } from 'rxjs';
import { SignupResponse } from '../models/signup-response';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private baseUrl=environment.baseUrl;
  readonly signupUrl = `${this.baseUrl}/api/users/signup`;

  constructor(private http: HttpClient) { }

  signUp(userData: UserAnswers): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(this.signupUrl, userData).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error (e.g., network issue)
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error (e.g., 500 Internal Server Error)
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
