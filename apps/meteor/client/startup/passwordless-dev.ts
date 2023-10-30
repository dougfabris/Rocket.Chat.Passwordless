import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

(Meteor as any).loginWithPasswordlessDev = function (credentialToken: string, callback?: (err?: any) => void): void {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				passwordlessDev: true,
				token: credentialToken,
			},
		],
		userCallback: callback,
	});
};
