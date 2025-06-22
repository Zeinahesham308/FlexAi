import { Component, Input } from '@angular/core';
import { Workouts } from '../../../models/workouts.interface';
import { WorkoutPlanDay } from '../../../models/workout-plan-day';
import { WorkoutService } from '../../../services/workout.service';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-workout-plan-navigator',
  standalone: false,

  templateUrl: './workout-plan-navigator.component.html',
  styleUrl: './workout-plan-navigator.component.scss'
})
export class WorkoutPlanNavigatorComponent {
  workoutDays: WorkoutPlanDay[] = [];
  currentDayIndex = 0;
  currentWorkoutDay?: WorkoutPlanDay;

  constructor(
    private workoutService: WorkoutService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadWorkoutPlan();
  }

   loadWorkoutPlan() {
    /* const userId = this.authService.getStoredUserId(); */
    const userId="68549868403dfec0a6b5f53f";
    this.workoutService.getWorkoutPlan(userId).subscribe({        
      next: (days) => {
        const response = days;
        console.log('Workout days loaded:', response.data.plan);
        this.workoutDays = response.data.plan;
        this.currentWorkoutDay = this.workoutDays[0];
        console.log('Current workout day:', this.currentWorkoutDay);
      },
      error: (err) => console.error('Failed to load workout plan', err)
    });
  }


  nextDay() {
    if (this.currentDayIndex < this.workoutDays.length - 1) {
      this.currentDayIndex++;
      this.currentWorkoutDay = this.workoutDays[this.currentDayIndex];
    }
  }

  prevDay() {
    if (this.currentDayIndex > 0) {
      this.currentDayIndex--;
      this.currentWorkoutDay = this.workoutDays[this.currentDayIndex];
    }
  }
}
