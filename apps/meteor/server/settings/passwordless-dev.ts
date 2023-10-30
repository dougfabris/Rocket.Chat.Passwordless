import { settingsRegistry } from '../../app/settings/server';

export const createPasswordlessSettings = () =>
	settingsRegistry.addGroup('Passwordless_Dev', async function () {
		await this.add('Passwordless_Dev_Enable', false, {
			type: 'boolean',
			public: true,
		});

		const enableQuery = {
			_id: 'Passwordless_Dev_Enable',
			value: true,
		};

		await this.add('Passwordless_Dev_Url', 'https://v4.passwordless.dev', {
			type: 'string',
			enableQuery,
		});

		await this.add('Passwordless_Dev_ApiKey', '', {
			type: 'string',
			enableQuery,
		});

		await this.add('Passwordless_Dev_ApiSecret', '', {
			type: 'string',
			enableQuery,
		});
	});
