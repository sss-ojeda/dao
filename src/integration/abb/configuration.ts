import { dbClient } from '../../db/pool'
import { camelToSnake } from '../../utils/camelSnake'

export const serializeSiteConfig = (rows: Array<any>): Array<ABBSiteConf> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'entityId': '',
			'siteId': '',
			'email': ''
		}
		for (const key in rowCopy) {
			if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}
		}
		return rowCopy
	})
	return serialized
}



export const serializeGlobalConfig = (rows: Array<any>): Array<ABBGlobalConf> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'email': '',
			'password': '',
			'apiKey': '',
			'organizationId': ''
		}
		for (const key in rowCopy) {
			if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}
		}
		return rowCopy
	})
	return serialized
}


const createSiteConfig = async (abbSiteConf: ABBSiteConf): Promise<boolean> => {
	const { entityId, siteId, email } = abbSiteConf

	const qs = `
		INSERT INTO abb_site_configuration (email, site_id, entity_id)
		VALUES ($1, $2, $3)
	`
	await dbClient.query(qs, [email, siteId, entityId])
	return true
}


export const getSiteConfigBySiteId = async (siteId: string): Promise<ABBSiteConf> => {

	const qs = `
		SELECT * FROM abb_site_configuration WHERE site_id=$1
	`
	const res = await dbClient.query(qs, [siteId])
	return serializeSiteConfig(res.rows)[0]
}


export const createGlobalConf = async (configuration: ABBGlobalConf): Promise<boolean> => {
	const { email, password, apiKey, organizationId } = configuration

	const qs = `
		INSERT INTO abb_global_configuration(email, password, api_key, organization_id)
		VALUES ($1, $2, $3, $4)
	`
	await dbClient.query(qs, [email, password, apiKey, organizationId])
	return true
}

export const getGlobalConfByOrganization = async (organizationId: string): Promise<Array<ABBGlobalConf>> => {
	const qs = `
		SELECT * FROM abb_global_configuration WHERE organization_id=$1
	`
	const res = await dbClient.query(qs, [organizationId])
	const config = serializeGlobalConfig(res.rows)
	return config
}

export const apiKeyExists = async (apiKey: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from abb_global_configuration where  api_key=$1)',
		[apiKey])
	return res.rows[0].exists
}

export const getGlobalConfByEmail = async  (email:string): Promise<ABBGlobalConf> => {
	const qs = `
		SELECT * FROM abb_global_configuration WHERE email=$1
	`
	const res = await dbClient.query(qs, [email])
	const config = serializeGlobalConfig(res.rows)
	return config[0]
}

export const getAllSiteConfigurations = async (): Promise<Array<ABBSiteConf>> => {
	const res = await dbClient.query(
		'SELECT * FROM abb_site_configuration '
	)
	return serializeSiteConfig(res.rows)
}



export   const abbConfiguration = {
	createSiteConfig,
	createGlobalConf,
	getGlobalConfByOrganization,
	apiKeyExists,
	getGlobalConfByEmail,
	getSiteConfigBySiteId,
	getAllSiteConfigurations
}
