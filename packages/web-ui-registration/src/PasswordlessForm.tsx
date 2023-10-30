import * as Passwordless from '@passwordlessdev/passwordless-client';
import { FieldGroup, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Form, ActionLink } from '@rocket.chat/layout';
import { UserContext, useLoginWithPassword, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import LoginServices from './LoginServices';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';

const LOGIN_SUBMIT_ERRORS = {
	'error-user-is-not-activated': {
		type: 'warning',
		i18n: 'registration.page.registration.waitActivationWarning',
	},
	'error-app-user-is-not-allowed-to-login': {
		type: 'danger',
		i18n: 'registration.page.login.errors.AppUserNotAllowedToLogin',
	},
	'user-not-found': {
		type: 'danger',
		i18n: 'registration.page.login.errors.wrongCredentials',
	},
	'error-login-blocked-for-ip': {
		type: 'danger',
		i18n: 'registration.page.login.errors.loginBlockedForIp',
	},
	'error-login-blocked-for-user': {
		type: 'danger',
		i18n: 'registration.page.login.errors.loginBlockedForUser',
	},
	'error-license-user-limit-reached': {
		type: 'warning',
		i18n: 'registration.page.login.errors.licenseUserLimitReached',
	},
	'error-invalid-email': {
		type: 'danger',
		i18n: 'registration.page.login.errors.invalidEmail',
	},
} as const;

export type LoginErrors = keyof typeof LOGIN_SUBMIT_ERRORS;

export const useLoginPasswordless = (): ((token: string) => Promise<void>) => {
	return useContext(UserContext).loginWithPasswordlessDev;
};

export const PasswordlessForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const {
		handleSubmit,
		setError,
		clearErrors,
		getValues,
		formState: { errors },
	} = useForm<{ username: string; password: string }>({
		mode: 'onBlur',
	});

	const { t } = useTranslation();
	const formLabelId = useUniqueId();
	const [errorOnSubmit, setErrorOnSubmit] = useState<LoginErrors | undefined>(undefined);
	const login = useLoginWithPassword();
	const showFormLogin = useSetting('Accounts_ShowFormLogin');
	const loginPasswordLess = useLoginPasswordless();

	const loginMutation = useMutation({
		mutationFn: (formData: { username: string; password: string }) => {
			return login(formData.username, formData.password);
		},
		onError: (error: any) => {
			if ([error.error, error.errorType].includes('error-invalid-email')) {
				setError('username', { type: 'invalid-email', message: t('registration.page.login.errors.invalidEmail') });
			}

			if ('error' in error && error.error !== 403) {
				setErrorOnSubmit(error.error);
				return;
			}

			setErrorOnSubmit('user-not-found');
		},
	});

	const usernameId = useUniqueId();
	const loginFormRef = useRef<HTMLElement>(null);

	const passwordlessApiUrl = useSetting<string>('Passwordless_Dev_Url');
	const passwordlessApiKey = useSetting<string>('Passwordless_Dev_ApiKey');

	useEffect(() => {
		if (loginFormRef.current) {
			loginFormRef.current.focus();
		}
	}, [errorOnSubmit]);

	const renderErrorOnSubmit = (error: LoginErrors) => {
		const { type, i18n } = LOGIN_SUBMIT_ERRORS[error];
		return (
			<Callout id={`${usernameId}-error`} aria-live='assertive' type={type}>
				{t(i18n)}
			</Callout>
		);
	};

	if (errors.username?.type === 'invalid-email') {
		return <EmailConfirmationForm onBackToLogin={() => clearErrors('username')} email={getValues('username')} />;
	}

	const handleLogin = async () => {
		if (passwordlessApiKey) {
			const passwordless = new Passwordless.Client({
				apiUrl: passwordlessApiUrl,
				apiKey: passwordlessApiKey,
			});

			const token = await passwordless.signinWithDiscoverable();
			if (!token.token) {
				return;
			}

			await loginPasswordLess(token.token);
		}
	};

	return (
		<Form
			tabIndex={-1}
			ref={loginFormRef}
			aria-labelledby={formLabelId}
			aria-describedby='welcomeTitle'
			onSubmit={handleSubmit(handleLogin)}
		>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.login')}</Form.Title>
			</Form.Header>
			{showFormLogin && (
				<>
					<Form.Container>
						<ButtonGroup large vertical stretch>
							<Button primary onClick={() => handleLogin()}>
								Login without password
							</Button>
							<Button onClick={() => setLoginRoute('register')}>Create an accouunt</Button>
						</ButtonGroup>
						{errorOnSubmit && <FieldGroup disabled={loginMutation.isLoading}>{renderErrorOnSubmit(errorOnSubmit)}</FieldGroup>}
					</Form.Container>
					<Form.Footer>
						<p>
							<ActionLink onClick={(): void => setLoginRoute('login')}>Login with password</ActionLink>
						</p>
					</Form.Footer>
				</>
			)}
			<LoginServices disabled={loginMutation.isLoading} setError={setErrorOnSubmit} />
		</Form>
	);
};

export default PasswordlessForm;
