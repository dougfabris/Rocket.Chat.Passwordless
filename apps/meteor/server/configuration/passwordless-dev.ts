import { PasswordlessClient, type PasswordlessOptions } from '@passwordlessdev/passwordless-nodejs';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../app/settings/server';

Accounts.registerLoginHandler('passwordless-dev', async (options: Record<string, any>) => {
	if (!options.passwordless || !settings.get<boolean>('Passwordless_dev')) {
		return;
	}

	const { token } = options;

	const apiUrl = settings.get<string>('Passwordless_Dev_Url');

	if (!token || !apiUrl) {
		return;
	}

	const clientOptions: PasswordlessOptions = {
		baseUrl: settings.get<string>('Passwordless_Dev_Url'),
	};
	const passwordlessClient = new PasswordlessClient(settings.get<string>('Passwordless_Dev_ApiSecret'), clientOptions);

	const verifiedUser = await passwordlessClient.verifyToken(token);

	if (verifiedUser) {
		console.log('Successfully verified sign-in for user.', verifiedUser);
	} else {
		console.warn('Sign in failed', verifiedUser);
	}
});
