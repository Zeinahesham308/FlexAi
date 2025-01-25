import { Component, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgForm } from '@angular/forms';
import { UserSignupInterface } from '../models/user.signup.interface';
import { Router } from '@angular/router';

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
  userLogin = {
    name: '',
    password: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router
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
        next: (response: any) => {
          console.log('Login successful:', response);
          localStorage.setItem('userData', JSON.stringify(response.data));
          // navigate to the home page
          this.router.navigate(['/home']);
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
