import { Workouts } from "./workouts.interface";

export interface WorkoutPlanDay {
    day: string;          // e.g. "Day 21 Push Workout"
    exercises: Workouts[];
}
