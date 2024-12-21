export interface UserAnswers {
    name: string;
    email: string;
    password: string;
    [key: string]: any; // For any additional answers dynamically added
}
