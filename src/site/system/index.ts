import { dbClient } from '../../db'
import { camelToSnake } from '../../utils/camelSnake'



const serialize = (rows: Array<any>): Array<SiteSystemInformation> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			siteId : '',
			size:0
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


export const getSiteSystemInfo = async (siteId: string): Promise<SiteSystemInformation> => {
	const siteSystemInformation = await dbClient.query('SELECT * FROM site_system_information WHERE site_id=$1', [siteId])
	return serialize(siteSystemInformation.rows)[0]
}


export const createSiteSystemInfo = async (siteSystemInformation: SiteSystemInformation): Promise<boolean> => {
	const {size, siteId } = siteSystemInformation

	const query = `
		INSERT INTO site_system_information(size,  site_id)
		VALUES ($1, $2)
	`

	await dbClient.query(query, [ size, siteId])
	return true
}

export const modifySiteSystem = async (siteSystemInformation: SiteSystemInformation) : Promise<boolean> => {
	const {size, siteId } = siteSystemInformation
	const qs = `
		UPDATE site_system_information SET
		size = $1
		WHERE site_id='${siteId}'
	`

	await dbClient.query(qs, [size])
	return true
}


export const siteHasSystemInfo = async (siteId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from site_system_information where  site_id=$1)',
		[siteId]
	)

	return res.rows[0].exists
}



export const systemDao =  {
	createSiteSystemInfo,
	getSiteSystemInfo,
	modifySiteSystem,
	siteHasSystemInfo
}
