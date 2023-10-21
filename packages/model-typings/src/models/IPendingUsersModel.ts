import type { IPendingUser } from '@rocket.chat/core-typings';
import type { InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IPendingUsersModel extends IBaseModel<IPendingUser> {
	insertOne(user: InsertionModel<Omit<IPendingUser, 'token'>>): Promise<InsertOneResult<IPendingUser>>;

	findOneByToken(token: string): Promise<IPendingUser | null>;
}
