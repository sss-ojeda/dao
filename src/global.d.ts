import * as express from 'express'
export { }
declare global {
	namespace NodeJS {
		interface Global {
			__rootdir__: string;
		}
	}

	interface SortOptions {
		order: 'ASC' | 'DESC';
		val: string;
	}

	interface SearchOptions {
		sort: SortOptions[];
		offset: number;
		limit: number;
	}
	interface Device {
		id?: string;
		name: string;
		type?: string;
		siteId: string;
		brand?: string;
		model?: string;
	}
	interface UserAccount {
		id?: string;
		firstName: string;
		lastName: string;
		email: string;
		role: RoleType;
		password: string;
		organizationId: string;
		organization?: Organization;
	}
	const enum OrganizationConfigurationEnum {
		ABB = 'ABB'
	}

	type OrganizationConfigurationType = OrganizationConfigurationEnum.ABB;


	interface ABBGlobalConf {
		email: string;
		password: string;
		apiKey: string;
		organizationId: string;
	}

	interface OrganizationConfiguration {
		type: OrganizationConfigurationType;
		values?: ABBGlobalConf;
	}
	interface Organization {
		id?: string;
		name: string;
		isClient: boolean;
		configurations: Array<OrganizationConfiguration>;
	}
	const enum RoleEnum {
		superadmin = 'SuperAdmin',
		admin = 'Admin',
		member = 'Member'
	}

	type RoleType = RoleEnum.superadmin | RoleEnum.member | RoleEnum.admin


	interface AuthorizerObject {
		all?: boolean;
		manager?: {
			admin?: boolean;
			member?: boolean;
		},
		client?: {
			admin?: boolean;
			member?: boolean;
		}
	}
	interface Ticket {
		id?: string;
		title: string;
		description: string;
		isClosed: boolean;
		status: string;
		createdAt: string;
		siteId: string;
		site?: Site;
		alerts?: Array<Alert>;
		deviceId?: string;
		device?: Device;

	}

	interface SitePowerTimeseries {
		siteId: string;
		p_ac: number;
		p_dc: number;
		time: string;
		interval: number
	}

	interface Ticket_tag {
		id?: string;
		name: string;
	}




	const enum SiteConfigurationEnum {
		bluelog = 'bluelog',
		solaredge = 'solaredge',
		ABB = 'ABB'
	}

	type SiteConfigurationType = SiteConfigurationEnum.bluelog | SiteConfigurationEnum.solaredge | SiteConfigurationEnum.ABB;

	interface BlueLogConf {
		loggerId: string;
		siteId: string;
	}
	interface SolarEdgeConf {
		apiKey: string;
		siteId: string;
		solarSiteId: string;
	}
	interface ABBSiteConf {
		entityId: string;
		email: string;
		siteId: string
	}


	interface Solar {
		id?: string;
		name: string;

		capacity: number;

		number: number;

	}

	interface Inverter {
		id?: string;
		name: string;
		capacity: number;
		number: number;
	}

	interface Battery {
		id?: string;
		name: string;
		capacity: number;

		number: number;

	}



	interface Ownership {
		id?: string;
	}


	const enum TimeseriesEnum {
		Hour = 'hour',
		Day = 'day',
		Month = 'month',
		Year = 'year',
		Minute = 'minute',
		Second = 'second'
	}

	type TimeSeriesUnitType = TimeseriesEnum.Hour | TimeseriesEnum.Day |
		TimeseriesEnum.Month | TimeseriesEnum.Year | TimeseriesEnum.Minute | TimeseriesEnum.Second;

	interface TicketComment {
		id?: string;
		ticketId: string;
		creatorId: string;
		createdAt: string;
		content: string;
		creator?: UserAccount;
	}


	interface User {
		id?: string;

		firstName: string;

		lastName: string;

		email: string;

		role: RoleType;
		password: string;
		organizationId: string;
	}


	interface SiteRate {
		siteId: string;
		startHour: string;
		endHour: string;
		price: number;
		id?: string;
		days: Array<number>;
	}

	interface SiteFinancialInfo {
		installationDate: Date;
		price: number;
		siteId: string;
	}

	interface SitePerformanceGuarantee {
		siteId: string;
		dailyGeneration: number;
		dailyEarnings: number
	}

	const enum FlatChargesCategoryEnum {
		environmental = 'environmental',
		marketOperator = 'marketOperator'
	}

	type FlatChargeCategoryType = FlatChargesCategoryEnum.environmental |
		FlatChargesCategoryEnum.marketOperator

	interface SiteFlatCharge {
		price: number;
		siteId: string;
		category: string;
		name: string;
		id?: string;
	}

	const enum InverterNotificationCategoryEnum {
		difference = 'difference',
		threshold = 'threshold',
		relativeDifference = 'relativeDifference'
	}

	interface SiteNotificationGroup {
		name: string;
		id: string;
		notifications: Array[CustomNotification],
		siteId: string;
		emails: Array<string>;
		site?: Site;
	}

	type NotificationStatusType = 'on' | 'off'
	interface CustomNotification {
		id?: string;
		name?: string;
		deviceId: string;
		siteNotificationGroupId?: string;
		status: NotificationStatusType;
	}

	type InverterNotificationCategoryType =
		InverterNotificationCategoryEnum.difference |
		InverterNotificationCategoryEnum.threshold |
		InverterNotificationCategoryEnum.relativeDifference

	interface InverterNotificationBase extends CustomNotification {
		category: InverterNotificationCategoryTtype;
		unit: InverterNotificationUnits;
	}
	interface ThresholdInverterNotificationRules {
		duration: number;
		value: number;
	}

	interface DifferenceInverterNotificationRules {
		percentage: number;
		meanValue: number;
		duration: number;
	}
	interface RelativeDifferenceInverterNotificationRules {
		percentage: number;
		duration: number;
	}
	interface DifferenceInverterNotification extends InverterNotification, DifferenceInverterNotificationRules { }
	interface InverterNotification extends InverterNotificationBase {
		category: InverterNotificationCategoryTtype;
		unit: InverterNotificationUnits
	}
	interface ThresholdInverterNotification extends InverterNotification {
		rules: ThresholdInverterNotificationRules
	}
	interface DifferenceInverterNotification extends InverterNotification {
		rules: DifferenceInverterNotificationRules
	}
	interface RelativeDifferenceInverterNotification extends InverterNotification {
		rules: RelativeDifferenceInverterNotificationRules
	}

    interface SiteMeterTimeseries {
        siteId: string;
		E?: number;
		B?: number;
		K?: number;
		Q?: number;
		selfConsumption?: number;
		time: string;
		interval: number
    }
	interface NMIMeterTimeseries {
        nmi: string;
		E?: number;
		B?: number;
		K?: number;
		Q?: number;
		time: string;
		interval: number
    }

	interface SelfConsumptionTimeserie {
		p_ac: number;
		siteId?: string;
		time: string;
	}
	interface DifferenceInverterNotificationRules {
		percentage: number;
		meanValue: number;
		duration: number;
	}
	interface RelativeDifferenceInverterNotificationRules {
		percentage: number;
		duration: number;
	}
	interface DifferenceInverterNotification extends InverterNotification, DifferenceInverterNotificationRules { }
	interface InverterNotification extends InverterNotificationBase {
		category: InverterNotificationCategoryTtype;
		unit: InverterNotificationUnits
	}
	interface ThresholdInverterNotification extends InverterNotification {
		rules: ThresholdInverterNotificationRules
	}
	interface DifferenceInverterNotification extends InverterNotification {
		rules: DifferenceInverterNotificationRules
	}
	interface RelativeDifferenceInverterNotification extends InverterNotification {
		rules: RelativeDifferenceInverterNotificationRules
	}
	interface Address {
		id : string
		name : string
		state? : string
		administrativeArea : string
		postcode : string
		siteId? : string
		country : string
		city : string
	}
	interface SiteInformation {
		address: Address;
		systemInformation: SiteSystemInformation;
	}



	interface SiteFinancialTimeserie {
		site_id: string;
		e: number;
		b: number;
		self_consumption: number;
		p_ac: number;
		price: number;
		savings: number;
		paid: number;
		time: string;

	}

	interface SiteSystemInformation {
		siteId: string;
		size: number;
	}
	namespace Express {
		interface User {
			id?: string;
			firstName: string;
			lastName: string;
			email: string;
			role: RoleType;
			password: string;
			organizationId: string;
		}
		interface Application {
			oauth: {
				server: OAuth2Server;

				constructor(options: OAuth2Server.ServerOptions);

				authenticate(options?: OAuth2Server.AuthenticateOptions): (
					request: express.Request,
					response: express.Response,
					next: express.NextFunction,
				) => Promise<OAuth2Server.Token>;

				authorize(options?: OAuth2Server.AuthorizeOptions): (
					request: express.Request,
					response: express.Response,
					next: express.NextFunction,
				) => Promise<OAuth2Server.AuthorizationCode>;

				token(options?: OAuth2Server.TokenOptions): (
					request: express.Request,
					response: express.Response,
					next: express.NextFunction,
				) => Promise<OAuth2Server.Token>;
			}
		}
		interface Request {
			user?: User
		}
	}

}


