import type { IImportUser, IUser } from '@rocket.chat/core-typings';
import { SHA256 } from '@rocket.chat/sha256';
import { hash as bcryptHash } from 'bcrypt';
import { Accounts } from 'meteor/accounts-base';

async function hashPassword(password: string): Promise<string> {
	return bcryptHash(SHA256(password), Accounts._bcryptRounds());
}

function generateTempPassword(userData: IImportUser): string {
	return `${Date.now()}${userData.name || ''}${userData.emails.length ? userData.emails[0].toUpperCase() : ''}`;
}

export type BuildNewUserObjectOptions = {
	flagEmailsAsVerified?: boolean;
};

export async function buildNewUserObject(userData: IImportUser, options: BuildNewUserObjectOptions = {}): Promise<Partial<IUser>> {
	return {
		type: userData.type || 'user',
		...(userData.username && { username: userData.username }),
		...(userData.emails.length && {
			emails: userData.emails.map((email) => ({ address: email, verified: !!options.flagEmailsAsVerified })),
		}),
		...(userData.statusText && { statusText: userData.statusText }),
		...(userData.name && { name: userData.name }),
		...(userData.bio && { bio: userData.bio }),
		...(userData.avatarUrl && { _pendingAvatarUrl: userData.avatarUrl }),
		...(userData.utcOffset !== undefined && { utcOffset: userData.utcOffset }),
		...{
			services: {
				// Add a password service if there's a password string, or if there's no service at all
				...((!!userData.password || !userData.services || !Object.keys(userData.services).length) && {
					password: { bcrypt: await hashPassword(userData.password || generateTempPassword(userData)) },
				}),
				...(userData.services || {}),
			},
		},
		...(userData.services?.ldap && { ldap: true }),
		...(userData.importIds?.length && { importIds: userData.importIds }),
		...(!!userData.customFields && { customFields: userData.customFields }),
		...(userData.deleted !== undefined && { active: !userData.deleted }),
	};
}
