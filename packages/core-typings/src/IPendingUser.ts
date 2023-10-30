import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IPendingUser extends IRocketChatRecord {
	username: string;
	name: string;
	email: string;
	token: string;
}
