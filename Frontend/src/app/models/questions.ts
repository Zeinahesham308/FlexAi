export interface Questions {
    id: number;
    question: string;
    type: string;
    placeholder?: string;  // Optional, for questions that have placeholders
    required: boolean;
    answer: string;
    options?: string[];  // Optional, for questions that are radio buttonsF
}
