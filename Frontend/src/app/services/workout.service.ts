import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { WorkoutPlanDay } from '../models/workout-plan-day';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  private readonly apiUrl = environment.baseUrl;

 
  constructor(private http: HttpClient) { }

  getWorkoutPlan(userId: string): Observable<any> {
    return this.http.get<WorkoutPlanDay[]>(`${this.apiUrl}/api/agent/workout-plan/user/${userId}`);
  }

  getWorkoutDay(dayId: string): Observable<WorkoutPlanDay> {
    return this.http.get<WorkoutPlanDay>(`${this.apiUrl}/days/${dayId}`);
  }
}

