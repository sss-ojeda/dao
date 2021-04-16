import { dbClient } from '../db'
import { camelToSnake } from '../utils/camelSnake'
import format from 'pg-format'
export const serialize = (rows: Array<any>): Array<SiteMeterTimeseries> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'siteId': '',
			'time': '',
			'E': 0,
			'B': 0,
			'K': 0,
			'Q': 0,
			'interval': 60
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

const getAllForSite = async (siteId: string, interval: TimeSeriesUnitType, start: string, end: string)
	: Promise<Array<SiteMeterTimeseries>> => {
	const values = [start, end, siteId]
	const targetTable = interval === 'day' ? 'site_meter_day_timeseries' :
		interval === 'hour' ? 'site_meter_hour_timeseries' :
			interval === 'month' ? 'site_meter_month_timeseries' :
				interval === 'minute' ? 'site_meter_timeseries' : ''
	const qs = `
	SELECT
	g.E, g.B, g.K, g.Q, time
	FROM ${targetTable} g
	WHERE
	time > $1
	AND g.time < $2
	AND site_id=$3
	ORDER BY time
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

export const getTotalSiteExportImportForHourPeriod = async (
	siteId: string,
	startDate: string,
	endDate: string,
	startHour: string,
	endHour: string,
	days: Array<number>
): Promise<{ totalImport: number, totalExport: number, count: number }> => {
	const values = [siteId, startHour, endHour]
	const qs = `
		select  SUM(E) AS E, SUM(B) AS B, COUNT(*)
		FROM site_meter_hour_timeseries
		WHERE site_id=$1
		AND extract(hour from time) between $2 AND $3
		AND extract(isodow from time) IN (${days.join(', ')})
	`
	// AND time between $4 AND $5
	const res = await dbClient.query(qs, values)

	const totalImport = res.rows[0].e
	const totalExport = res.rows[0].b
	const count = res.rows[0].count
	return { totalImport, totalExport, count }

}


export const getAllImportExportForSite = async (siteId: string, interval: TimeSeriesUnitType, start: string, end: string)
	: Promise<Array<SiteMeterTimeseries>> => {
	const values = [start, end, siteId]
	const targetTable = interval === 'day' ? 'site_meter_day_timeseries' :
		interval === 'hour' ? 'site_meter_hour_timeseries' :
			interval === 'month' ? 'site_meter_month_timeseries' :
				interval === 'minute' ? 'site_meter_timeseries' : ''
	const qs = `
	SELECT
	g.E, g.B time
	FROM ${targetTable} g
	WHERE
	time > $1
	AND g.time < $2
	AND site_id=$3
	ORDER BY time
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

export const create = async (newSiteMeterTimeseries: SiteMeterTimeseries): Promise<SiteMeterTimeseries> => {
	const { siteId, time, E, B, K, Q,  interval } = newSiteMeterTimeseries
	const query = `
	INSERT INTO site_meter_timeseries(site_id, time,E, B, K, Q,interval)
	VALUES ($1, $2, $3, $4, $5, $6, $7)`
	await dbClient.query(query, [siteId, time, E, B, K, Q,  interval])
	return newSiteMeterTimeseries
}


export const batchCreate = async ( siteMeterTimeseries: Partial<SiteMeterTimeseries & { time: string; interval: number; device_id: string; }>[]): Promise<boolean> => {
	if (siteMeterTimeseries.length === 0) {
		return
	}

	const dataToInsert = siteMeterTimeseries.map(
		({ E, B, K, Q, time, interval, siteId }) =>
			[
				E || null,
				B || null,
				Q || null,
				K || null,
				time || null,
				interval || null,
				siteId || null
			],
	)


	const sqlQuery = format(
		`INSERT INTO site_meter_timeseries
		(
			E, B, K, Q,
			time, interval, site_id
		) VALUES %L
		ON CONFLICT
		DO NOTHING
			`,
		dataToInsert,
	)

	try {
		await dbClient.query(sqlQuery)
		return true
	} catch (error) {
		console.error('batchCreateBLMeteoDataTimestamp', error)

	}
}

export const batchNMICreate = async ( siteMeterTimeseries: Partial<NMIMeterTimeseries & { time: string; interval: number; device_id: string; }>[]): Promise<boolean> => {
	if (siteMeterTimeseries.length === 0) {
		return
	}

	const dataToInsert = siteMeterTimeseries.map(
		({ E, B, K, Q, time, interval, nmi }) =>
			[
				E || null,
				B || null,
				Q || null,
				K || null,
				time || null,
				interval || null,
				nmi || null
			],
	)


	const sqlQuery = format(
		`INSERT INTO nmi_timeseries
		(
			E, B, K, Q,
			time, interval, nmi
		) VALUES %L
		ON CONFLICT
		DO NOTHING
			`,
		dataToInsert,
	)

	try {
		await dbClient.query(sqlQuery)
		return true
	} catch (error) {
		console.error('batchCreateBLMeteoDataTimestamp', error)

	}
}

export const matchAllSitesDataToNmi = async () => {
	const qs = `
	INSERT INTO site_meter_timeseries (interval, time, site_id, E , B , K , Q )
	 (
		SELECT interval, time, site_id, SUM(E) as E, SUM(B) as B, SUM(K) AS K, SUM(Q) AS Q from nmi_timeseries
		INNER JOIN site_nmi
		ON site_nmi.nmi = nmi_timeseries.nmi
		GROUP BY site_id, time, interval
	)
	ON CONFLICT DO NOTHING
	`
	await dbClient.query(qs)
}



export const consumptionDao  = {
	serialize,
	getAllForSite,
	matchAllSitesDataToNmi,
	create,
	batchCreate,
	batchNMICreate
}
