export interface Workouts {
    id: string;
    name: string;
    muscleGroup: string;
    sets?: number;
    reps?: number;
    link?: string;
    completed: boolean;
    exerciseCount: number;
    date: Date;
}
