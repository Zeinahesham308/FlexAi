import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { UserProfile } from '../models/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserAccountInfoService {

  private apiUrl = `${environment.baseUrl}/api/users/dashboard`;

  constructor(private http: HttpClient) { }

    // Get single user by ID
  getUserAccount(userId: string): Observable<UserProfile> {
    userId = "6851dbacec913c13f60890de"; // Example user ID,  TODO: remoce this hardcoded value as it is passed from the auth service in ts component
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }

  // Update user account
  updateUserAccount(userId: string, updates: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/${userId}`, updates);
  }
}
