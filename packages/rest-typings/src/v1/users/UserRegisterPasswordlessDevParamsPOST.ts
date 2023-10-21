import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UserRegisterPasswordlessDevParamsPOST = {
	username: string;
	name: string;
	email: string;
};

const UserRegisterPasswordlessDevParamsPostSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		email: {
			type: 'string',
		},
	},
	required: ['username', 'name', 'email'],
	additionalProperties: false,
};

export const isUserRegisterPasswordlessDevParamsPOST = ajv.compile<UserRegisterPasswordlessDevParamsPOST>(
	UserRegisterPasswordlessDevParamsPostSchema,
);
