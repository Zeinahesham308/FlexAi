import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionsService } from '../services/questions.service';
import { Questions } from '../models/questions';
import { UserAnswers } from '../models/user-answers';
import { AuthService } from '../services/auth-service';
import { SignupService } from '../services/signup.service';
import { NgForm,FormBuilder,FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  encapsulation: ViewEncapsulation.None, // Disable encapsulation
})

export class SignUpComponent  {


  // Flag to track whether the sign-up mode is active
  isSignUpMode = false;
  // Flag to track if the user has interacted with radio inputs
  isTouched = false;
  userLogin= {
    name: '',
    email: '',
    password: ''
  };

  constructor(private questionsService: QuestionsService, private authService: AuthService, private signUpService: SignupService,
  ) { }

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
      this.authService.verifyUser(this.userLogin).subscribe({
        next: (data) => {
          console.log('Login successful:', data);
          // navigate to the home page

        },
        error: (err) => {
          console.error('Login failed:', err.message);
          // Display error message to the user
          alert('Login failed. Please check your credentials and try again.');
        }
      });

    }

  }

  /* lw mst5dmtha4 hms7ha */
/* 
  signup():void {
    this.signUpService.signUp(this.userAnswers).subscribe({
      next: (data) => {
        console.log('Signup successful:', data);
        // navigate to the home page
      },
      error: (err) => {
        console.error('Signup failed:', err.message);
        // Display error message to the user
        alert('Signup failed. Please check your credentials and try again.');
      }
    });
  } */



}

