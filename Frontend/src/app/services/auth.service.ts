import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { UserSignupInterface } from '../models/user.signup.interface';
import { UserLoginInterface } from '../models/user.login.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;



  constructor(private http: HttpClient) {}

  loginUser(user: UserLoginInterface) {
    console.log('tmm login', user);
    return this.http.post(`${this.baseUrl}/api/users/login`, user);
  }

  registerUser(user: UserSignupInterface) {
    console.log('tmm', user);
    return this.http.post(`${this.baseUrl}/api/users/signup`, user);
  }
}
