export interface Workouts {
    name: string;
    main_muscle: string; /* mn backend esmha main_muscle h3mlha / body_part */
    body_part: string; // Optional, used for frontend display
    sets?: number;
    reps?: string;
    completed?: boolean;
}
