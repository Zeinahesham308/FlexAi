import { Component, OnInit } from '@angular/core';
import { QuestionsService } from './services/questions.service';
import { Questions } from '../models/questions';
import { UserAnswers } from '../models/user-answers';

@Component({
  selector: 'app-sign-up',
  standalone: false,

  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})

export class SignUpComponent implements OnInit {

 /*  genderChosen: boolean = false;
  questionsList: Questions[] = [];
  currentIndex: number = 0;
  displayedQuestions: Questions[] = [];
  userAnswers: UserAnswers = {};

  selectedHeightUnit: string = 'cm';
  selectedWeightUnit: string = 'Kg';
  selectedLocation: string = '';
  inputAnswer: string = '';

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
      this.saveCurrentAnswers();
      // Increment the current index
      this.currentIndex++;
      // Check if the current index is within the bounds of the questions list
      if (this.currentIndex < this.questionsList.length) {
        this.displayedQuestions = [this.questionsList[this.currentIndex]];
      } else {
        console.log("No more questions to display.");
      }
      console.log("location", this.selectedLocation);
      console.log("Selected weight unit", this.selectedWeightUnit);
    } console.log("Selected height unit", this.selectedHeightUnit);
  }
  goToPreviousQuestion() {
    if (this.currentIndex === 3) {
      this.displayInitialQuestions();
    } else if (this.currentIndex > 0) {
      this.currentIndex--; // Decrement index to go back
      this.displayedQuestions = [this.questionsList[this.currentIndex]];
    }

  }


  updateProperties(value: string, propertyName: string) {
    if (propertyName === 'selectedLocation') {
      this.selectedLocation = value;
    } else if (propertyName === 'selectedHeightUnit') {
      this.selectedHeightUnit = value;
    } else if (propertyName === 'selectedWeightUnit') {
      this.selectedWeightUnit = value;
    }
  }

  handleChange(value: string, propertyName: string, questionId: number) {
    this.updateProperties(value, propertyName); // Check if the question requires concatenation 
    console.log(`handleChange called with value: ${value}, propertyName: ${propertyName}, questionId: ${questionId}`);
    console.log(`Before concatenation: inputAnswer = ${this.inputAnswer}, selectedHeightUnit = ${this.selectedHeightUnit}`);
    if (questionId === 5) {
      this.userAnswers[questionId] = `${this.inputAnswer} ${this.selectedHeightUnit}`;
    } else {
      this.userAnswers[questionId] = value;
    }
    console.log('Updated answer:', this.userAnswers[questionId]);
    console.log('Updated answer in handleChange:', this.userAnswers[questionId]);
  }

  printAnswer(questionId: number) {
    console.log('Final answer:', this.userAnswers[questionId]); // Log the final answer
  }
  saveCurrentAnswers() {
    console.log('displayedQuestions before saving:', this.displayedQuestions);
    this.displayedQuestions.forEach((q) => {
      if (this.userAnswers[q.id] !== undefined) {
        q.answer = this.userAnswers[q.id]; // Sync the answer with displayedQuestions
      }
    });
    console.log('Saved Answers:', this.userAnswers); // Log the saved answers 
  }

  currentQuestionIndex = 0;
  nextQuestion() {
    if (this.currentQuestionIndex < this.questionsList.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }
 */
  
  questionsList: Questions[] = [];
  currentIndex: number = 0;
  displayedQuestions: Questions[] = [];
  userAnswers: UserAnswers = {};

  constructor(private questionsService: QuestionsService) { }

  ngOnInit(): void {
    this.questionsService.getQuestions().subscribe((data) => {
      this.questionsList = data;
      console.log("Questions List:", this.questionsList);
    });
  }
  currentQuestionIndex = 0;
  nextQuestion() {
    if (this.currentQuestionIndex < this.questionsList.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitForm() {
    // Handle form submission
    console.log('Form submitted', this.questionsList);
  }


  // Property to track whether the sign-up mode is active
  isSignUpMode = false;

  // Toggle sign-up mode when sign-up button is clicked
  onSignUpClick() {
    this.isSignUpMode = true;
  }

  // Toggle sign-in mode when sign-in button is clicked
  onSignInClick() {
    this.isSignUpMode = false;
  }

}

