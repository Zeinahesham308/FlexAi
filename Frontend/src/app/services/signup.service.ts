import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserAnswers } from '../models/user-answers';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignupService {

  readonly signupUrl = 'https://localhost:3000/api/auth/signup';

  constructor(private http: HttpClient) { }

  signUp(userDate:UserAnswers):Observable<any>{
    return this.http.post(this.signupUrl, userDate);
  }
}
