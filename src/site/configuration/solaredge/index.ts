import {dbClient} from '../../../db/pool'
import { camelToSnake } from '../../../utils/camelSnake'

const serialize = (rows: Array<any>): Array<SolarEdgeConf> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'solarSiteId': '',
			'siteId': '',
			'apiKey': ''
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
const getBySite = async (siteId: string): Promise<SolarEdgeConf> => {
	const qs = `
    SELECT api_key, solar_site_id, site_id  FROM solaredge_site_configuration
    WHERE site_id=$1`
	const res = await dbClient.query(qs, [siteId])
	const conf = serialize(res.rows)[0]
	return conf
}

const create = async (conf: SolarEdgeConf): Promise<boolean> => {
	const { siteId, apiKey, solarSiteId } = conf
	const qs = `
    INSERT INTO solaredge_site_configuration
    (site_id, api_key, solar_site_id)
    VALUES ($1, $2, $3)`
	await dbClient.query(qs, [siteId, apiKey, solarSiteId])
	return true
}

const getAllSiteConfigurations = async (): Promise<Array<SolarEdgeConf>> => {
	const qs = `
    SELECT api_key, solar_site_id, site_id  FROM solaredge_site_configuration
    `
	const res = await dbClient.query(qs)
	const configs = serialize(res.rows)
	return configs
}

export default {
	getBySite,
	create,
	getAllSiteConfigurations
}
