import { Component, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionsService } from '../services/questions.service';
import { Questions } from '../models/questions';
import { UserAnswers } from '../models/user-answers';
import { AuthService } from '../services/auth.service';
import { NgForm, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserSignupInterface } from '../models/user.signup.interface';
import { UserLoginInterface } from '../models/user.login.interface';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  encapsulation: ViewEncapsulation.None, // Disable encapsulation
})
export class SignUpComponent implements OnInit {
  // Flag to track whether the sign-up mode is active
  isSignUpMode = false;
  attempingSignUp = false;
  SignUpEvent:EventEmitter<UserSignupInterface> = new EventEmitter<UserSignupInterface>();

  // Flag to track if the user has interacted with radio inputs
  isTouched = false;
  userLogin = {
    name: '',
    password: '',
  };

  constructor(
    private questionsService: QuestionsService,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
      this.SignUpEvent.subscribe((signupData) => {
        this.attempingSignUp = true;
        this.authService.registerUser(signupData).subscribe({
          next: (response) => {
            this.attempingSignUp = false;
            console.log('API Response:', response);
            this.isSignUpMode = false;
          },
          error:(err) => {
            // Add error handling
            this.attempingSignUp = false;
            console.error('API Error:', err);
          }
      });
      })
  }

  setTouched() {
    this.isTouched = true;
  }

  // Toggle sign-up mode when sign-up button is clicked
  onSignUpClick() {
    this.isSignUpMode = true;
  }

  // Toggle sign-in mode when sign-in button is clicked
  onSignInClick() {
    this.isSignUpMode = false;
  }

  // Login user
  loginUser(form: NgForm): void {
    if (form.valid) {
      this.authService.loginUser(this.userLogin).subscribe({
        next: (data) => {
          console.log('Login successful:', data);
          // navigate to the home page
        },
        error: (err) => {
          console.error('Login failed:', err.message);
          // Display error message to the user
          alert('Login failed. Please check your credentials and try again.');
        },
      });
    }
  }

}
