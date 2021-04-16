import { QueryResult } from 'pg'
import format from 'pg-format'
import { dbClient } from '../db'
import { camelToSnake } from '../utils/camelSnake'
import {SoilTimeserie, SoilData} from '@autonomy-power/types'

export const serialize = (rows: Array<any>): Array<SoilTimeserie> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'deviceId': '',
			'SLI1':0,
			'SLI2':0,
			'E_AP_REL1':0,
			'SR1':0,
			'SR2':0,
			'T':0,
			'interval': '60',
			time: ''
		}
		for (const key in rowCopy) {
			if (['E', 'B', 'K', 'Q'].includes(key)) {
				rowCopy[key] = row[key.toLowerCase()]
			}

			else if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}

		}
		return rowCopy
	})
	return serialized
}

export const getAllForSite = async (siteId: string, interval: string, start: string, end: string)
	: Promise<Array<SoilTimeserie>> => {
	const values = [start, end, siteId]
	const targetTable = interval === 'day' ? 'site_soil_day_timeseries' :
		interval === 'hour' ? 'site_soil_hour_timeseries' :
			interval === 'month' ? 'site_soil_month_timeseries' :
				interval === 'minute' ? 'site_soil_minute_timeseries' : ''
	const qs = `
	SELECT
	SLI1,
	time,
	site_id,
		SLI2,
		E_AP_REL1,
		SR1,
		SR2,
		T
	FROM ${targetTable} g
	WHERE
	time > $1
	AND g.time < $2
	AND site_id=$3
	ORDER BY time
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return rows
}

const batchCreateBLSoilDataTimestamp = async (meteoData: Partial<SoilData & { time: string; interval: number; device_id: string; }>[]): Promise<QueryResult> => {
	const dataToInsert = meteoData.map(
		({ E_AP_REL1, SLI1, SLI2, SR1, SR2, T, time, interval, device_id }) =>
			[
				E_AP_REL1 || null,
				SLI1 || null,
				SLI2 || null,
				SR1 || null,
				SR2 || null,
				time || null,
				T || null,
				interval || null,
				device_id || null,
			],
	)

	const sqlQuery = format(
		'INSERT INTO soil_timeseries (E_AP_REL1, SLI1, SLI2, SR1, SR2, time, T, interval, device_id) VALUES %L',
		dataToInsert,
	)

	return await dbClient.query(sqlQuery)
}

const batchUpsertBLSoilDataTimestamp = async (meteoData: Partial<SoilData & { time: string; interval: number; device_id: string; }>[]): Promise<QueryResult> => {
	const dataToInsert = meteoData.map(
		({ E_AP_REL1, SLI1, SLI2, SR1, SR2, T, time, interval, device_id }) =>
			[
				E_AP_REL1 || null,
				SLI1 || null,
				SLI2 || null,
				SR1 || null,
				SR2 || null,
				time || null,
				T || null,
				interval || null,
				device_id || null,
			],
	)

	const sqlQuery = format(
		`INSERT INTO soil_timeseries (E_AP_REL1, SLI1, SLI2, SR1, SR2, time, T, interval, device_id) VALUES %L
		ON CONFLICT (time, device_id, interval)
		DO UPDATE
		SET E_AP_REL1 = excluded.E_AP_REL1,
		SLI1 = excluded.SLI1,
		SLI2 = excluded.SLI2,
		SR1 = excluded.SR1,
		SR2 = excluded.SR2
		`,dataToInsert
	)

	return await dbClient.query(sqlQuery)
}

export default {getAllForSite, batchCreateBLSoilDataTimestamp, batchUpsertBLSoilDataTimestamp}
