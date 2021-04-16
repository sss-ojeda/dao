import { dbClient } from '../../db/pool'
import { searchQueryBuilder } from '../../db/queryBuilder'
import { camelToSnake } from '../../utils/camelSnake'
import alertDao from './alert'
const columnNames = [
	'name',
	'capacity',
	'number',
]

const serialize = (rows: Array<any>): Array<Inverter> => {
	const serialized = rows.map(row => {
		const rowCopy = {

			'name': '',

			'capacity': 0,

			'number': 0,

			'id': ''
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

export const getInfo = async (inverterId: string) => {
	const inverter = await dbClient.query('SELECT * FROM device WHERE id=$1', [inverterId])
	return serialize(inverter.rows)[0]
}

export const getAll = async (options: SearchOptions): Promise<Array<Inverter>> => {
	const { queryOptions, values } = searchQueryBuilder('device', [...columnNames], options)

	const queryStr = `
	SELECT
	i.id,
	i.name, i.capacity, i.number
	FROM
	device i
	where type='inverter'
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)

	return serialize(res.rows)
}




export const inverterIdExists = async (inverterId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from inverter where  id=$1)',
		[inverterId])
	return res.rows[0].exists
}


export const getAllBySite = async (siteId: string): Promise<Array<Inverter>> => {
	const qs = `
	SELECT * FROM  device
	WHERE type='inverter'
	AND site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])
	return serialize(res.rows)
}

export const getAllCountBySite = async (siteId: string): Promise<number> => {
	const qs = `
	SELECT COUNT(*) FROM  device
	WHERE type='inverter'
	AND site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])
	return Number(res.rows[0].count)
}


const getSiteAllInvertersGeneralData = async (siteId: string, interval: string, start: string, end: string) => {
	const qs = `
	select * from inverter_general_data_timeseries
	JOIN device on (device_id=device.name
	AND device.site_id=$1)
	AND time BETWEEN $2 AND $3

	`

	const res = await dbClient.query(qs, [siteId, start, end])
	return res.rows
}

const getInvertersGeneralData = async (inverters: Array<string>, start: string, end: string, interval: string) => {
	const values = [start, end]
	const targetTable = interval === 'day' ? 'inverter_general_data_day_timeseries' :
		interval === 'hour' ? 'inverter_general_data_hour_timeseries' :
			interval === 'minute' ? 'inverter_general_data_timeseries' : ''
	const qs = `
	SELECT
		*
		FROM ${targetTable}

		WHERE
		("time" BETWEEN $1 AND $2)
		AND
		device_id IN (${inverters.map((i) => `'${i}'`).join(',')})
		ORDER BY time ASC
	`
	const res = await dbClient.query(qs, values)
	return res.rows
}

export default {
	getAll,
	getInfo,
	getAllBySite,
	inverterIdExists,
	getSiteAllInvertersGeneralData,
	getAllCountBySite,
	getInvertersGeneralData,
	alert: alertDao
}
