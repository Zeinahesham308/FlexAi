
export type MessageStatus = 'sending' | 'sent' | 'failed';
export interface ChatMessage {
    isBot: boolean;
    text: string;
    status?:MessageStatus;
}
