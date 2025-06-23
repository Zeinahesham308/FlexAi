import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { UserSignupInterface } from '../models/user.signup.interface';
import { UserLoginInterface } from '../models/user.login.interface';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private currentUserId: string | null = null; // Stores userId



  constructor(private http: HttpClient) { }

  loginUser(user: UserLoginInterface) {
    console.log('tmm login', user);
    return this.http.post(`${this.baseUrl}/api/users/login`, user).pipe(
      tap((response: any) => {
        console.log('Login successful:', response);
        this.currentUserId = response.data.userId; // Store userId from response
        console.log('tmm currentUserId', this.currentUserId);
      }),
     

    );
  }

  registerUser(user: UserSignupInterface) {
    console.log('tmm', user);
    return this.http.post(`${this.baseUrl}/api/users/signup`, user);
  }

  // Get the stored userId (sync)
  getStoredUserId(): string {
    
    console.log('tmm getStoredUserId', this.currentUserId);
    return this.currentUserId ?? '';
  }
  getUserId(): string {
    const rawUserData = localStorage.getItem('userData');
    console.log('userid from localstorage', rawUserData);
    if (!rawUserData) {
      return "dkcdjscj";
    }
    const userData = JSON.parse(rawUserData).userId;
    return userData;
}
}
