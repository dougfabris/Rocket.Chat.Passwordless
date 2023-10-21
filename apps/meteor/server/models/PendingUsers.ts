import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { PendingUsersRaw } from './raw/PendingUsers';

registerModel('IPendingUsersModel', new PendingUsersRaw(db));
