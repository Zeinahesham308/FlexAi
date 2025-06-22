import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Workouts } from '../../../models/workouts.interface';

@Component({
  selector: 'app-workout-day-card',
  standalone: false,

  templateUrl: './workout-day-card.component.html',
  styleUrl: './workout-day-card.component.scss'
})
export class WorkoutDayCardComponent {
  @Input() exercises: Workouts[] = []; 
  // exercises: Workouts[] = [
  //   {
  //     name: 'Push-ups',
  //     completed: false,
  //     main_muscle: 'Chest',
  //     sets: 3,
  //     reps:"10" ,
  //     body_part: 'Upper Body',
  //   },
  //   {
  //     name: 'Squats',
  //     completed: true,
  //     main_muscle: 'Legs',
  //     sets: 4,
  //     reps: '12',
  //     body_part: 'Lower Body',
  //   },
  //   {
  //     name: 'Pull-ups',
  //     completed: true,
  //     main_muscle: 'Back',
  //     sets: 3,
  //     reps: "8",
  //     body_part: 'Upper Body',
  //   }
  // ];
  @Input() dayTitle!: string;
  @Input() isActive: boolean = false;
  @Output() exerciseSwapped = new EventEmitter<{
    originalExerciseName: string;  // The name of the original exercise being swapped
    newExercise: Workouts;
  }>()


  /* ========================================= Helper Functions =========================================*/

  get completedExercises(): number {
    return this.exercises.filter(ex => ex.completed).length;
  }


  handleSwap(event: { originalExerciseName: string, newExercise: Workouts }) {
    // Update local exercises array
    this.exercises = this.exercises.map(ex =>
      ex.name === event.originalExerciseName ? event.newExercise : ex
    );

    // Notify parent component (dashboard)      
    this.exerciseSwapped.emit(event);
  }

}
