import { PasswordlessClient, type PasswordlessOptions } from '@passwordlessdev/passwordless-nodejs';
import { PendingUsers, Users } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../app/settings/server';
import { buildNewUserObject } from '../lib/buildNewUserObject';

Accounts.registerLoginHandler('passwordless-dev', async (options: Record<string, any>) => {
	if (!options.passwordlessDev) {
		return;
	}

	if (!settings.get<boolean>('Passwordless_dev')) {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Passwordless.dev is disabled.'),
		};
	}

	const { token } = options;
	const apiUrl = settings.get<string>('Passwordless_Dev_Url');

	if (!apiUrl) {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Passwordless.dev is not configured.'),
		};
	}

	if (!token || typeof token !== 'string') {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Invalid credential token'),
		};
	}

	const clientOptions: PasswordlessOptions = {
		baseUrl: settings.get<string>('Passwordless_Dev_Url'),
	};
	const passwordlessClient = new PasswordlessClient(settings.get<string>('Passwordless_Dev_ApiSecret'), clientOptions);

	const verifiedUser = await passwordlessClient.verifyToken(token);

	if (!verifiedUser?.success) {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Unable to validate login token'),
		};
	}

	// If an user already exists with the associated passwordless user id, just login
	const user = await Users.findOneByPasswordlessId(verifiedUser.userId);
	if (user) {
		return {
			userId: user._id,
		};
	}

	// If there's no valid user, check if we have a pending user with that id, then create a full user with that data
	const pendingUser = await PendingUsers.findOneById(verifiedUser.userId);
	if (!pendingUser) {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Unable to find user registration data.'),
		};
	}

	const userData = buildNewUserObject({
		type: 'user',
		username: pendingUser.username,
		emails: [pendingUser.email],
		name: pendingUser.name,
		services: {
			passwordless_dev: {
				passwordlessUserId: verifiedUser.userId,
			},
		},
		importIds: [verifiedUser.userId],
	});

	const userId = wrapExceptions(() => Accounts.insertUserDoc({}, userData)).suppress();

	if (!userId) {
		return {
			type: 'passwordless-dev',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Failed to create user'),
		};
	}

	// Remove the record from the pending user collection to prevent new users from being created.
	await wrapExceptions(() => PendingUsers.removeById(verifiedUser.userId)).suppress();

	return {
		userId,
	};
});
