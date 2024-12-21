import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserAnswers } from '../models/user-answers';
import { catchError, Observable, throwError } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly baseUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  verifyUser(user: UserAnswers):Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, user).pipe(
      catchError((error) => {
        console.error('Error occurred during login:', error); // Log the error
        return throwError(() => new Error('Failed to login. Please try again later.'));
      })
    );
  }


}
