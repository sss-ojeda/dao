import { dbClient } from '../db'
import { camelToSnake } from '../utils/camelSnake'
import siteDao from './site'
import {GenerationTimeseries} from '@autonomy-power/types'

export const serialize = (rows: Array<any>): Array<GenerationTimeseries> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'deviceId': row['device'] || '',
			'time': row['time'] || row['i'] || '',
			'g_ac': row['g_ac'] || 0,
			'g_dc': row['g_dc'] || 0,
			'interval': 60
		}

		for (const key in rowCopy) {
			if (['g_ac', 'g_dc'].includes(key)) {
				rowCopy[key] = row[key.toLocaleLowerCase()]
			}

			else if (key === 'device') {
				if (Object.hasOwnProperty.call(row, 'name')) {
					rowCopy.deviceId = row['name']
				}
			}
			else if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}

		}
		if (row['p_ac']) {
			rowCopy['g_ac'] = row['g_ac']
		}
		else if (row['p_dc']) {
			rowCopy['g_dc'] = row['g_dc']
		}
		else if (row['device']) {
			rowCopy['device'] = row['device']
		}
		else if (row['i']) {
			rowCopy['time'] = row['i']
		}
		return rowCopy
	})
	return serialized
}

const getSiteAllInvertersHourGeneration = async (siteId: string, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [siteId, start, end]
	const qs = `
	SELECT
		time,
		device_id,
		device.name as device_name,
		g_ac,
		g_dc
		FROM inverter_generation_hour_timeseries
		JOIN device on (device_id=device.id AND device.site_id=$1)
		WHERE
		"time" BETWEEN $2 AND $3
		ORDER BY time ASC
	`
	const res = await dbClient.query(qs, values)

	const rows = res.rows
	return serialize(rows)
}
const getInvertersGeneration = async (inverters: Array<string>, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [start, end]
	const qs = `
	SELECT
		time,
		device_id,
		g_ac,
		g_dc
		FROM inverter_generation_timeseries
		WHERE
		"time" BETWEEN $1 AND $2
		AND
		device_id IN (${inverters.map((i) => `'${i}'`).join(',')})
		ORDER BY time ASC
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows

	return rows
}
const getInvertersGenerationHour = async (inverters: Array<string>, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [start, end]
	const qs = `
		SELECT
		time,
		device_id,
		g_ac,
		g_dc
		FROM inverter_generation_hour_timeseries
		WHERE
		"time" BETWEEN $1 AND $2
		AND
		device_id IN (${inverters.map((i) => `'${i}'`).join(',')})
		ORDER BY time ASC
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return rows
}
const getInvertersGenerationDay = async (inverters: Array<string>, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [start, end]
	const qs = `
	SELECT
		time,
		device_id,
		g_ac,
		g_dc
		FROM inverter_generation_day_timeseries
		WHERE
		"time" BETWEEN $1 AND $2
		AND
		device_id IN (${inverters.map((i) => `'${i}'`).join(',')})
		ORDER BY time ASC
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows

	return serialize(rows)
}
const getSiteAllInvertersDayGeneration = async (inverterId: string, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [inverterId, start, end]
	const qs = `
	SELECT
		time,
		device_id as device,

		device.name as device_name,
		g_ac,
		name,
		g_dc
		FROM inverter_generation_day_timeseries JOIN device on (device_id=device.name AND device.site_id=$1)
		WHERE
		"time" BETWEEN $2 AND $3
		ORDER BY time
	`
	const res = await dbClient.query(qs, values)
	const rows = res.rows

	return serialize(rows)
}

const getSiteAllInvertersGenerationData = async (siteId: string, interval: string, start: string, end: string)
	: Promise<Array<GenerationTimeseries>> => {
	const values = [siteId, start, end]
	const qs = `
		SELECT
		time_bucket('${interval}',"time") AS "time",
		device_id ,
		name,
		avg(g_ac) AS "g_ac",
		avg(g_ac) AS "g_dc",

		device.name as device_name,
		FROM inverter_generation_timeseries JOIN device on (device_id=device.name AND device.site_id=$1)
		WHERE
		"time" BETWEEN $2 AND $3
		GROUP BY 1,2,3
		ORDER BY 1,2,3
	`
	const res = await dbClient.query(qs, values)
	const rows = res.rows

	return serialize(rows)
}




export default {
	getSiteAllInvertersGenerationData,
	getSiteAllInvertersHourGeneration,
	getSiteAllInvertersDayGeneration,
	getInvertersGeneration,
	getInvertersGenerationDay,
	getInvertersGenerationHour,
	site: siteDao
}

