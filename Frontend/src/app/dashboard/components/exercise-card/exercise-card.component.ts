import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Workouts } from '../../../models/workouts.interface';
import { AuthService } from '../../../services/auth.service';
import { ExerciseService } from '../../../services/exercise.service';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-exercise-card',
  standalone: false,

  templateUrl: './exercise-card.component.html',
  styleUrl: './exercise-card.component.scss'
})
export class ExerciseCardComponent {
  @Input() exercise: Workouts = {
    name: 'Default Exercise',
    main_muscle: 'General',
    body_part: 'General',
    sets: 3,
    reps: "10",
  };


  userId!: string;
  isSwapping: boolean = false; // Flag to indicate if the exercise is being swapped
  @Output() exerciseSwapped = new EventEmitter<{
    originalExerciseName: string;  // The name of the original exercise being swapped
    newExercise: Workouts;
  }>();
 @Output() completionChanged = new EventEmitter<{name: string, completed: boolean}>();


  constructor(
    private exerciseService: ExerciseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.userId = this.authService.getStoredUserId();
  }


  /**
   * Handles the completion status change
   * @param event The checkbox change event
   */
  onCompletionChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isCompleted = checkbox.checked;
    
    // Update local state
    this.exercise.completed = isCompleted;
    
    // Emit to parent component with exercise ID and new state
    this.completionChanged.emit({
      name: this.exercise.name,
      completed: isCompleted
    });
  }


  async swapExercise(): Promise<void> {
    if (!this.exercise) {
      console.error('No exercise selected to swap');
      return;
    }
    this.isSwapping = true; // Set the flag to indicate swapping is in progress

    try {
      this.userId="6856aebe32a5e2286d5d2fe5";

      // Call exercise service to get a replacement exercise
      const newExercise = await lastValueFrom(
        this.exerciseService.getAlternativeExercise(
          this.userId,
          this.exercise.name,
          this.exercise.main_muscle
        )
      );


      if (!newExercise) {
        this.showError('No alternative exercise found');
        return;
      }

      this.exerciseSwapped.emit({
        originalExerciseName: this.exercise.name,  // Emit name as identifier
        newExercise: {
          ...newExercise,
          completed: false
        }
      });
      this.showSuccess('Exercise swapped successfully!');

    } catch (error) {
      console.error('Swap failed:', error);
        this.snackBar.open('Failed to swap exercise. Please try again.', 'Close', {
        duration: 3000
      });
    } finally {
      this.isSwapping = false;
    }
  }
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }



}
