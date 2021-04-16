import { dbClient } from '../../db/pool'
import { camelToSnake } from '../../utils/camelSnake'

const serialize = (rows: Array<any>): Array<BlueLogConf> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'loggerId': '',
			'siteId': '',
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

const create = async (blueLogConfig: BlueLogConf): Promise<boolean> => {
	const { loggerId, siteId } = blueLogConfig

	const queryStr = `
	INSERT INTO bluelog_configuration(logger_id, site_id)
	 VALUES ($1, $2)`
	await dbClient.query(queryStr, [loggerId, siteId])
	return true
}

const getBySite = async (siteId: string): Promise<BlueLogConf> => {
	const queryStr = `
    SELECT logger_id, site_id FROM bluelog_configuration WHERE site_id=$1
    `
	const res = await dbClient.query(queryStr, [siteId])
	const config = serialize(res as any)[0]
	return config
}

const loggerIdExists = async (loggerId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from bluelog_configuration where  logger_id=$1)',
		[loggerId])
	return res.rows[0].exists
}

const getInfo = async (loggerId: string): Promise<BlueLogConf> => {
	const res = await dbClient.query(
		'select * from bluelog_configuration where  logger_id=$1',
		[loggerId])
	const row = res.rows[0]
	const bluelogConf = {
		siteId: row.site_id,
		loggerId: row.logger_id
	}
	return bluelogConf
}

export const bluelogConfigurationDao = {
	loggerIdExists,
	create,
	getInfo,
	getBySite
}
