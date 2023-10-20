import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../app/settings/server';

Accounts.registerLoginHandler('passwordless-dev', async (options) => {
	if (!options.passwordless || !settings.get<boolean>('Passwordless_dev')) {
		return;
	}

	const { token } = options;

	const apiUrl = settings.get<string>('Passwordless_Dev_Url');

	if (!token || !apiUrl) {
		return;
	}

	const response = await fetch(`${apiUrl}/signin/verify`, {
		method: 'POST',
		body: JSON.stringify({ token }),
		headers: {
			'ApiSecret': 'myapplication:secret:11f8dd7733744f2596f2a28544b5fbc4',
			'Content-Type': 'application/json',
		},
	});

	const body = await response.json();

	if (body.success) {
		console.log('Successfully verified sign-in for user.', body);
		// Set a cookie/userid.
	} else {
		console.warn('Sign in failed.', body);
	}
});
