import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private questionsUrl= "/assets/data/questions.json";

  constructor(private http: HttpClient) { }

  getQuestions():Observable<any[]>{
    return this.http.get<any[]>(this.questionsUrl);
  }
}
