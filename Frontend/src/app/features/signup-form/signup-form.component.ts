import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Questions } from '../../models/questions';
import { QuestionsService } from '../../services/questions.service';
import { UserSignupInterface } from '../../models/user.signup.interface';
/**
 * SignupFormComponent handles the user signup process.
 * It dynamically loads questions, validates user inputs and submits the form data to API.
 */
@Component({
  selector: 'app-signup-form',
  standalone: false,
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss'],
})
export class SignupFormComponent implements OnInit {
  signupForm!: FormGroup;
  questionsList: Questions[] = [];
  lastQuestionIndex!: number; // Index of the last question (excluding the first three fields)
  currentQuestionIndex = 0;
  signupData!: UserSignupInterface;
  workoutPlace: string = '';

  @Input() SignUpEvent: EventEmitter<UserSignupInterface> = new EventEmitter<UserSignupInterface>();
  @Input() attempingSignUp = false;

  constructor(
    private questionsService: QuestionsService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    // Fetch questions
    this.questionsService.getQuestions().subscribe((data) => {
      this.questionsList = data;
      this.lastQuestionIndex = this.questionsList.length - 3;
      console.log('Questions List:', this.questionsList);
    });

    // Initialize form
    this.initializeForm();

    // Initialize userAnswers with default values
    this.signupData = {
      name: '',
      email: '',
      password: '',
      userAnswers: {},
    };
  }

  /**
   * Initializes the form with controls and validators.
   * Includes fields for user details and dynamic questions.
   */
  initializeForm() {
    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      gender: ['', Validators.required],
      age: ['', Validators.required],
      height: [
        '',
        [Validators.required, Validators.min(100), Validators.max(250)],
      ], // Height between 100 and 250 cm
      currentWeight: [
        '',
        [Validators.required, Validators.min(30), Validators.max(300)],
      ], // Weight between 30 and 300 kg
      targetWeight: [
        '',
        [Validators.required, Validators.min(30), Validators.max(300)],
      ], // Weight between 30 and 300 kg
      bodyType: ['', Validators.required],
      goal: ['', Validators.required],
      place: ['', Validators.required],
      equipments: ['', Validators.required],
      time: ['', Validators.required],
    });
  }

  /**
   * Helper method to get a form control by its name.
   * @param controlName - The name of the form control.
   * @returns The form control or a default object if the control does not exist.
   */
  getControl(controlName: string) {
    const control = this.signupForm.get(controlName);
    return control || { invalid: false, touched: false, value: null };
  }

  /**
   * Checks if the "Next" button should be enabled.
   * Validates the current question or the first three fields depending on the current index.
   * @returns True if the "Next" button should be enabled, otherwise false.
   */
  isNextButtonEnabled(): boolean {
    if (this.currentQuestionIndex === 0) {
      const firstThreeControls = ['name', 'email', 'password'];

      console.log('First Three Controls:', firstThreeControls); // Debugging
      console.log(
        'First Three Validity:',
        firstThreeControls.map(
          (controlName) => this.signupForm.get(controlName)?.valid
        )
      ); // Debugging

      return firstThreeControls.every((controlName) => {
        const control = this.signupForm.get(controlName);
        return control ? control.valid : false;
      });
    } else {
      const controlNames = Object.keys(this.signupForm.controls);
      const currentControlName = controlNames[this.currentQuestionIndex + 2];
      const currentControl = this.signupForm.get(currentControlName);
      return currentControl ? currentControl.valid : false;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex === 8 && this.workoutPlace !== 'Home') {
      // Skip the next question (index 9) if the answer is not "Home"
      this.currentQuestionIndex += 2;
    } else {
      // Otherwise, proceed to the next question
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex === 10 && this.workoutPlace !== 'Home') {
      // If the current question is "Time" and the workout place is not "Home",
      // skip the "Equipment" question when going back
      this.currentQuestionIndex -= 2;
    } else {
      // Otherwise, go to the previous question
      this.currentQuestionIndex--;
    }
  }

  /**
   * Handles form submission.
   * Validates the form and sends user answers to the API.
   */
  onSubmit(): void {
    if (this.signupForm.valid) {
      //disable the form submit
      // Dynamically populate userAnswers with form values
      Object.keys(this.signupForm.controls).forEach((controlName) => {
        if (
          controlName === 'name' ||
          controlName == 'email' ||
          controlName == 'password'
        ) {
          this.signupData[controlName] =
            this.signupForm.get(controlName)?.value;
          return;
        }
        this.signupData.userAnswers[controlName] =
          this.signupForm.get(controlName)?.value;
      });

      console.log('User Answers:', this.signupData); // Debugging

      this.SignUpEvent.emit(this.signupData);

      // Send userAnswers to the API
      // this.signUpService.signUp(this.userAnswers).subscribe({
      //   next: (response) => {
      //     console.log('API Response:', response);
      //     alert('Signup successful!');
      //     // Handle success (e.g., show a success message or navigate to another page)
      //   },
      //   error: (err) => {
      //     console.error('API Error:', err);
      //     alert('An error occurred. Please try again.');
      //     // Handle error (e.g., show an error message)
      //   },
      // });
    } else {
      // Check if the form is invalid due to the question of index 9
      const equipmentsControl = this.signupForm.get('equipments'); // Replace 'question9' with the actual control name

      if (this.workoutPlace !== 'home' && equipmentsControl?.invalid) {
        // If workoutPlace is not 'home' and question9 is invalid, remove the error for question9
        equipmentsControl.setErrors(null); // Clear the errors for question9
        this.onSubmit(); // Retry submission
      } else {
        // Otherwise, show the alert for missing required fields
        alert('Please fill out all required fields.');
      }
    }
  }

  /**
   * Gets the options for the current question.
   * @returns An array of options for the current question.
   */
  getCurrentQuestionOptions(): string[] {
    return this.questionsList[this.currentQuestionIndex + 2].options || [];
  }

  // Update the value when the user selects an option
  onWorkoutPlaceChange(value: string): void {
    this.workoutPlace = value;
  }
}
