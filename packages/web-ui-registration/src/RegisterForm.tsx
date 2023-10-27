/* eslint-disable complexity */
import * as Passwordless from '@passwordlessdev/passwordless-client';
import {
	FieldGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	ButtonGroup,
	Button,
	TextAreaInput,
	Callout,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useEndpoint, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';

type LoginRegisterPayload = {
	name: string;
	passwordConfirmation: string;
	username: string;
	password: string;
	email: string;
	reason: string;
};

export const RegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }) => {
	const { t } = useTranslation();

	const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');
	const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));

	const formLabelId = useUniqueId();
	const nameId = useUniqueId();
	const emailId = useUniqueId();
	const usernameId = useUniqueId();
	const reasonId = useUniqueId();

	const registerUser = useRegisterMethod();
	const customFields = useAccountsCustomFields();

	const [serverError] = useState<string | undefined>(undefined);

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		// setError,
		getValues,
		clearErrors,
		control,
		formState: { errors },
	} = useForm<LoginRegisterPayload>({ mode: 'onBlur' });

	const registerFormRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (registerFormRef.current) {
			registerFormRef.current.focus();
		}
	}, []);

	const getRegistration = useEndpoint('POST', '/v1/users.registerPasswordless');

	const passwordlessApiUrl = useSetting<string>('Passwordless_Dev_Url');
	const passwordlessApiKey = useSetting<string>('Passwordless_Dev_ApiKey');

	const handleRegister = async ({ username, name, email }: LoginRegisterPayload) => {
		const {
			user: { token },
		} = await getRegistration({ username, name, email });

		if (token && passwordlessApiKey) {
			const p = new Passwordless.Client({
				apiKey: passwordlessApiKey,
				apiUrl: passwordlessApiUrl,
			});

			try {
				await p.register(token, username);
				dispatchToastMessage({ type: 'success', message: 'User created successfully' });
				setLoginRoute('passwordless');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		}

		// 	registerUser.mutate(
		// 		{ pass: password, ...formData },
		// 		{
		// 			onError: (error: any) => {
		// 				if ([error.error, error.errorType].includes('error-invalid-email')) {
		// 					setError('email', { type: 'invalid-email', message: t('registration.component.form.invalidEmail') });
		// 				}
		// 				if (error.errorType === 'error-user-already-exists') {
		// 					setError('username', { type: 'user-already-exists', message: t('registration.component.form.usernameAlreadyExists') });
		// 				}

		// 				if (/Email already exists/.test(error.error)) {
		// 					setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyExists') });
		// 				}

		// 				if (/Username is already in use/.test(error.error)) {
		// 					setError('username', { type: 'username-already-exists', message: t('registration.component.form.userAlreadyExist') });
		// 				}
		// 				if (/error-too-many-requests/.test(error.error)) {
		// 					dispatchToastMessage({ type: 'error', message: error.error });
		// 				}
		// 				if (/error-user-is-not-activated/.test(error.error)) {
		// 					dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
		// 					setLoginRoute('login');
		// 				}
		// 				if (error.error === 'error-user-registration-custom-field') {
		// 					setServerError(error.message);
		// 				}
		// 			},
		// 		},
		// 	);
		// };
	};

	if (errors.email?.type === 'invalid-email') {
		return <EmailConfirmationForm onBackToLogin={() => clearErrors('email')} email={getValues('email')} />;
	}

	return (
		<Form
			tabIndex={-1}
			ref={registerFormRef}
			aria-labelledby={formLabelId}
			aria-describedby='welcomeTitle'
			onSubmit={handleSubmit(handleRegister)}
		>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.form.createAnAccount')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<FieldLabel required={requireNameForRegister} htmlFor={nameId}>
							{t('registration.component.form.name')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', {
									required: requireNameForRegister ? t('registration.component.form.requiredField') : false,
								})}
								error={errors?.name?.message}
								aria-required={requireNameForRegister}
								aria-invalid={errors.name ? 'true' : 'false'}
								placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
								aria-describedby={`${nameId}-error`}
								id={nameId}
							/>
						</FieldRow>
						{errors.name && (
							<FieldError aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={emailId}>
							{t('registration.component.form.email')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('email', {
									required: t('registration.component.form.requiredField'),
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: t('registration.component.form.invalidEmail'),
									},
								})}
								placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
								error={errors?.email?.message}
								aria-required='true'
								aria-invalid={errors.email ? 'true' : 'false'}
								aria-describedby={`${emailId}-error`}
								id={emailId}
							/>
						</FieldRow>
						{errors.email && (
							<FieldError aria-live='assertive' id={`${emailId}-error`}>
								{errors.email.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={usernameId}>
							{t('registration.component.form.username')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('username', {
									required: t('registration.component.form.requiredField'),
								})}
								error={errors?.username?.message}
								aria-required='true'
								aria-invalid={errors.username ? 'true' : 'false'}
								aria-describedby={`${usernameId}-error`}
								id={usernameId}
								placeholder='jon.doe'
							/>
						</FieldRow>
						{errors.username && (
							<FieldError aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</FieldError>
						)}
					</Field>
					{manuallyApproveNewUsersRequired && (
						<Field>
							<FieldLabel required htmlFor={reasonId}>
								{t('registration.component.form.reasonToJoin')}
							</FieldLabel>
							<FieldRow>
								<TextAreaInput
									{...register('reason', {
										required: t('registration.component.form.requiredField'),
									})}
									error={errors?.reason?.message}
									aria-required='true'
									aria-invalid={errors.reason ? 'true' : 'false'}
									aria-describedby={`${reasonId}-error`}
									id={reasonId}
								/>
							</FieldRow>
							{errors.reason && (
								<FieldError aria-live='assertive' id={`${reasonId}-error`}>
									{errors.reason.message}
								</FieldError>
							)}
						</Field>
					)}
					<CustomFieldsForm formName='customFields' formControl={control} metadata={customFields} />
					{serverError && <Callout type='danger'>{serverError}</Callout>}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' disabled={registerUser.isLoading} primary>
						{t('registration.component.form.joinYourTeam')}
					</Button>
				</ButtonGroup>
				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default RegisterForm;
