import { Component, OnInit } from '@angular/core';
import { QuestionsService } from './services/questions.service';
import { Questions } from '../models/questions';

@Component({
  selector: 'app-sign-up',
  standalone: false,

  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})

export class SignUpComponent implements OnInit {

  genderChosen: boolean = false;
  questionsList: Questions[] = [];
  currentIndex: number = 0;
  displayedQuestions: Questions[] = [];

  selectedHeightUnit: string = 'cm';
  selectedWeightUnit: string = 'Kg';
  selectedLocation: string = '';

  constructor(private questionsService: QuestionsService) { }

  setGender() {
    this.genderChosen = true;
  }

  selectUnit(unit: string) {
    this.selectedHeightUnit = unit;
  }
  ngOnInit(): void {
    this.questionsService.getQuestions().subscribe((data) => {
      this.questionsList = data;
      console.log("Questions List:", this.questionsList);
      this.displayInitialQuestions();
    });
  }

  // Display first 3 questions
  displayInitialQuestions(): void {
    this.displayedQuestions = this.questionsList.slice(0, 3);
    console.log("Displayed Initial Questions:", this.displayedQuestions);
    this.currentIndex = 2;
    console.log("Current Index after initial display:", this.currentIndex);

  }

  // Next button click
  onNextClick(signUpForm: any): void {

    if (signUpForm.valid) {
      // Increment the current index
      this.currentIndex++;
      // Check if the current index is within the bounds of the questions list
      if (this.currentIndex < this.questionsList.length) {
        this.displayedQuestions = [this.questionsList[this.currentIndex]];
      } else {
        console.log("No more questions to display.");
      }
      console.log("location", this.selectedLocation);
    }
  }
  goToPreviousQuestion() {
    if (this.currentIndex === 3) {
      this.displayInitialQuestions();
    } else if (this.currentIndex > 0) {
      this.currentIndex--; // Decrement index to go back
      this.displayedQuestions = [this.questionsList[this.currentIndex]];
    }

  }

}

