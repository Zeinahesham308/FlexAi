import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserAnswers } from '../models/user-answers';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.baseUrl;


  readonly loginUrl = `${this.baseUrl}/api/users/login`;

  constructor(private http: HttpClient) { }

  verifyUser(user: UserAnswers): Observable<any> {
    return this.http.post(this.loginUrl, user).pipe(
      catchError((error) => {
        let errorMessage = 'Failed to login. Please try again later.';
        if (error.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        console.error('Error occurred during login:', error); // Log the error
        return throwError(() => new Error(errorMessage));
      })
    );
  }


}
