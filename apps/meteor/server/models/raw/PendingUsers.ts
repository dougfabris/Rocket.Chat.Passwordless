import type { IPendingUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IPendingUsersModel } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PendingUsersRaw extends BaseRaw<IPendingUser> implements IPendingUsersModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IPendingUser>>) {
		super(db, 'pending_users', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { credentialToken: 1 }, unique: false },
			{ key: { email: 1 }, unique: false },
		];
	}

	public async findOneByToken(token: string): Promise<IPendingUser | null> {
		return this.findOne({ credentialToken: token });
	}
}
