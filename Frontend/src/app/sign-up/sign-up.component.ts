import { Component, OnInit } from '@angular/core';
import { QuestionsService } from './services/questions.service';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})

export class SignUpComponent implements OnInit {

  genderChosen:boolean = false;
  questionsList:any[]=[];

  constructor(private questionsService:QuestionsService){}

  setGender(){
    this.genderChosen = true;
  }

  ngOnInit(): void {
    this.questionsService.getQuestions().subscribe((data)=>{
      this.questionsList=data;
    });
  }
}

