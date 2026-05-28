export type Role = 'user' | 'model' | 'system';

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  title?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  codeBlocks?: CodeBlock[];
  isCommand?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  activeModel: string;
}

export interface AppSettings {
  apiKey: string;
  defaultModel: string;
  systemInstruction: string;
}
