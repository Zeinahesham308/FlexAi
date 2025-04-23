
export type MessageStatus = 'sending' | 'sent' | 'failed';
export interface ChatMessage {
    text: string;
    isBot: boolean;
    status?:MessageStatus;
}
