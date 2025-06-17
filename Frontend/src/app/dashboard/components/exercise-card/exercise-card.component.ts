import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets?: number;
  reps?: number;
  link?: string;
}
@Component({
  selector: 'app-exercise-card',
  standalone: false,

  templateUrl: './exercise-card.component.html',
  styleUrl: './exercise-card.component.scss'
})
export class ExerciseCardComponent {
  @Input() exercise: Exercise = {
    id: '1',
    name: 'Default Exercise',
    muscleGroup: 'General',
    sets: 3,
    reps: 10,
    link: " "
  };

  @Input() showActions: boolean = true;
  @Output() exerciseDeleted = new EventEmitter<string>();


  deleteExercise() {
    if (confirm('Are you sure you want to delete this exercise?')) {
      this.exerciseDeleted.emit(this.exercise.id);
    }
  }



}
