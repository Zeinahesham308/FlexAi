export interface UserProfile {
    id?: string;
    name: string;
    avatarUrl?: string;
    gender: "male" | "female";
    currentWeight: number;
    targetWeight: number;
    height: number;
    goal: "lose weight" | "gain weight" | "maintain weight" | "ay haga" ;
    stats?:{
        streak: number ;
        workoutsCompleted: number ;
    };
}
