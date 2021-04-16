
import { dbClient } from '../../../db/pool'
import { camelToSnake } from '../../../utils/camelSnake'

const serialize = (rows: Array<any>): Array<ABBGlobalConf> => {
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

const createGlobalConf = async (configuration: ABBGlobalConf): Promise<boolean> => {
	const { email, password, apiKey, organizationId } = configuration

	const queryStr = `
		INSERT INTO abb_global_configuration(email, password, api_key, organization_id)
		VALUES ($1, $2, $3, $4)
	`
	await dbClient.query(queryStr, [email, password, apiKey, organizationId])
	return true
}

const getByOrganization = async (organizationId: string): Promise<Array<ABBGlobalConf>> => {
	const queryStr = `
		SELECT email FROM abb_global_configuration WHERE organization_id=$1
	`
	const res = await dbClient.query(queryStr, [organizationId])
	const config = serialize(res.rows)
	return config
}

const apiKeyExists = async (apiKey: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from abb_global_configuration where  api_key=$1)',
		[apiKey])
	return res.rows[0].exists
}

export default {
	createGlobalConf,
	getByOrganization,
	apiKeyExists
}
