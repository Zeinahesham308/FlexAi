import { Workouts } from './workouts.interface';
export interface CalendarDay{
    date: Date;
    isCurrentMonth: boolean;
    workouts: Workouts[]; // Array of workouts for that day
    isToday?: boolean;
}
