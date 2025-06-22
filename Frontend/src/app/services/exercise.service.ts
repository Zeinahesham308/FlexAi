import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workouts } from '../models/workouts.interface';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  private readonly apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getAlternativeExercise(
    userId: string,
    exceriseToReplace: string,
    targetMusc: string
  ): Observable<Workouts> {
    const body = {
      userId,
      exceriseToReplace: exceriseToReplace,
      targetMusc
    };

    return this.http.post<Workouts>(`${this.apiUrl}/api/agent/plan/update-exercise`, { body });
  }

}
