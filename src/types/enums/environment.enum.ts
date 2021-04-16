export type EnvironmentVariables = {
	PORT: string
	FRONTEND_URL: string;

	POSTGRES_USER: string
	POSTGRES_PASSWORD: string
	POSTGRES_DB: string
	POSTGRES_HOST: string
	POSTGRES_PORT: string
	PGDATA: string

	AWS_ACCESS_KEY_ID: string
	AWS_SECRET_ACCESS_KEY: string
	AWS_REGION: string

	ENVIRONMENT: string
	SESSION_SECRET: string

	API_SERVER_ADDRESS: string
	SENTRY_DSN_API: string
	IMAP_HOST: string
	IMAP_USER: string
	IMAP_PWD: string
	IMAP_SERVER: string
	NODE_ENV: string
	BLUE_LOG_PATH: string
	TZ: string

	JWT_AUTH_TOKEN_SECRET: string
}

export enum ConfigKeys {
	port = 'PORT',
	frontEndUrl = 'FRONTEND_URL',

	postgresUser = 'POSTGRES_USER',
	postgresPassword = 'POSTGRES_PASSWORD',
	postgresDb = 'POSTGRES_DB',
	postgresHost = 'POSTGRES_HOST',
	postgresPort = 'POSTGRES_PORT',
	pgData = 'PGDATA',

	awsAccessKeyId = 'AWS_ACCESS_KEY_ID',
	awsSecretAccessKey = 'AWS_SECRET_ACCESS_KEY',
	awsRegion = 'AWS_REGION',

	environment = 'ENVIRONMENT',
	sessionSecret = 'SESSION_SECRET',

	apiServerAddress = 'API_SERVER_ADDRESS',
	sentryDsnApi = 'SENTRY_DSN_API',

	imapHost = 'IMAP_HOST',
	imapUser = 'IMAP_USER',
	imapPwd = 'IMAP_PWD',
	imapServer = 'IMAP_SERVER',
	nodeEnv = 'NODE_ENV',
	blueLogPath = 'BLUE_LOG_PATH',
	tz = 'TZ',
	jwtAuthTokenSecret = 'JWT_AUTH_TOKEN_SECRET',
}
