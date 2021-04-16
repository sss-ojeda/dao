import { dbClient } from '../db'
import { camelToSnake } from '../utils/camelSnake'
import {PowerTimeseries} from '@autonomy-power/types'

export const serialize = (rows: Array<any>): Array<PowerTimeseries> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'deviceId': '',
			'time': '',
			'p_ac': 0,
			'p_dc': 0,
			'interval': 60
		}
		for (const key in rowCopy) {
			if (['p_ac', 'p_dc'].includes(key)) {
				rowCopy[key] = row[key.toLocaleLowerCase()]
			}
			if (key === 'device') {
				if (Object.hasOwnProperty.call(row, 'name')) {
					rowCopy.deviceId = row['name']
				}
			}
			else if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}

		}
		return rowCopy
	})
	return serialized
}

export const create = async (newPowerTimeseries: PowerTimeseries): Promise<PowerTimeseries> => {
	const { device, time, p_ac, p_dc, interval } = newPowerTimeseries
	const query = `
	INSERT INTO inverter_power_timeseries(device_id, time, p_ac, p_dc, interval)
	VALUES ($1, $2, $3, $4, $5)`
	await dbClient.query(query, [device, time, p_ac, p_dc, interval])
	return newPowerTimeseries
}

export const batchCreate = async (newInverterPowerTimeseries: Array<PowerTimeseries>): Promise<boolean> => {
	try {
		const queryString = `
			INSERT INTO inverter_power_timeseries (device_id, time, p_ac, P_DC, interval)
			SELECT * FROM UNNEST ($1::text[], $2::timestamp[],$3::float[],$4::float[],$5::int[])
			ON CONFLICT (time, device_id, interval)
			DO UPDATE SET p_ac = excluded.p_ac,
			p_dc = excluded.p_dc
		`
		await dbClient.query(
			queryString, compartiment(newInverterPowerTimeseries)
		)
		return true
	} catch (e) {
		return false
	}
}
const getLatestSitePower = async (siteId: string): Promise<PowerTimeseries> => {
	const query = `
	SELECT * FROM site_power_timeseries WHERE site_id=$1 ORDER BY time DESC LIMIT 1`
	const res = await dbClient.query(query, [siteId])
	const lastTimestamp = serialize(res.rows)[0]
	return lastTimestamp
}

const getLatestPositiveSitePower = async (siteId: string): Promise<PowerTimeseries> => {
	const query = `
	SELECT * FROM site_power_timeseries WHERE site_id=$1 AND p_ac > 0 ORDER BY time DESC LIMIT 1`
	const res = await dbClient.query(query, [siteId])
	const lastTimestamp = serialize(res.rows)[0]
	return lastTimestamp
}

const batchCreateSitePower = async (sitePowerTimeseries: Array<SitePowerTimeseries>): Promise<boolean> => {
	try {
		const qs = `
			INSERT INTO site_power_timeseries (site_id, time, p_ac, p_dc, interval)
			SELECT * FROM UNNEST ($1::text[], $2::timestamp[],$3::float[],$4::float[],$5::int[])
			ON CONFLICT DO NOTHING
		`
		await dbClient.query(
			qs, compartimentSitePower(sitePowerTimeseries)
		)
		return true
	} catch (e) {
		console.error(e)
		return false
	}
}

const batchCreateSitePowerUpsert = async (sitePowerTimeseries: Array<SitePowerTimeseries>): Promise<boolean> => {
	try {
		const qs = `
			INSERT INTO site_power_timeseries (site_id, time, p_ac, p_dc, interval)
			SELECT * FROM UNNEST ($1::text[], $2::timestamp[],$3::float[],$4::float[],$5::int[])
			ON CONFLICT (time, site_id, interval)
			DO UPDATE SET P_AC = excluded.P_AC,
			P_DC = excluded.P_DC
		`
		await dbClient.query(
			qs, compartimentSitePower(sitePowerTimeseries)
		)
		return true
	} catch (e) {
		console.error(e)
		return false
	}
}

const getTimeSeriesSeconds = (timeUnit: TimeSeriesUnitType): number => {
	switch (timeUnit) {
		case TimeseriesEnum.Day:
			return 24 * 60 * 60
		case TimeseriesEnum.Hour:
			return 60 * 60
		case TimeseriesEnum.Month:
			return 24 * 60 * 60 * 31
		case TimeseriesEnum.Year:
			return 24 * 60 * 60 * 365
		case TimeseriesEnum.Minute:
			return 60
		case TimeseriesEnum.Second:
			return 1
		default:
			throw new Error(`${timeUnit} is not a valid timeseries intervalType`)
	}
}

const getInverterGenerationData = async (inverterId: string, interval: TimeSeriesUnitType, start: Date, end: Date)
	: Promise<Array<PowerTimeseries>> => {
	const values = [start, end, inverterId]
	const qs = `
	SELECT time_bucket('${getTimeSeriesSeconds(interval)} seconds', time)
	AS interval,
	g.p_ac, g.p_dc, time, COUNT(*)
	FROM inverter_power_timeseries g
	WHERE
	time > $1
	AND g.time < $2
	AND device_id=$3
	GROUP BY time, interval, g.p_ac, g.p_dc
	ORDER BY time
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

const getSiteAllInvertersGenerationData = async (siteId: string, interval: TimeSeriesUnitType, start: Date, end: Date)
	: Promise<Array<PowerTimeseries>> => {
	const values = [siteId, start, end]
	const qs = `
		SELECT
		SUM(g.p_ac) as p_ac, SUM(g.p_dc) as p_dc,
		g.time
		FROM inverter_power_timeseries g
		INNER JOIN device d
		ON g.device_id=d.name
		AND d.site_id=$1
		AND g.time > $2 AND g.time < $3
		GROUP BY time
		ORDER BY time
	`
	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

export const updateSitePowerWithInverterData = async (siteId: string, start: string, end: string): Promise<boolean> => {
	// const values = [siteId, start, end]
	try {
		const qs = `
	INSERT INTO site_power_timeseries (P_AC, P_DC,  time, interval,site_id)
	(SELECT
	SUM(g.P_AC) as P_AC, SUM(g.P_DC) as P_DC,
	g.time, g.interval, d.site_id
	FROM inverter_power_timeseries g
	INNER JOIN device d
	ON g.time BETWEEN $2 AND $3 AND g.device_id=d.id
	AND d.site_id=$1
	AND p_ac > 0
	GROUP BY time, g.interval, d.site_id
	ORDER BY time
	)
	ON CONFLICT (time, site_id, interval)
	DO UPDATE SET P_AC = excluded.P_AC,
	P_DC = excluded.P_DC
	`
		const values = [siteId, start, end]
		await dbClient.query(qs, values)
		return
	} catch (e) {
		console.error(e)
	}
}



const compartiment = (arr: Array<PowerTimeseries>) => {
	const final = [[], [], [], [], []]
	arr.forEach(t => {
		final[0].push(t.deviceId)
		final[1].push(t.time)
		final[2].push(t.p_ac)
		final[3].push(t.p_dc)
		final[4].push(t.interval)
	})
	return final
}

const compartimentSitePower = (arr: Array<SitePowerTimeseries>) => {
	const final = [[], [], [], [], []]
	arr.forEach(t => {
		final[0].push(t.siteId)
		final[1].push(t.time)
		final[2].push(t.p_ac)
		final[3].push(t.p_dc)
		final[4].push(t.interval)
	})
	return final
}

export default {
	create,
	batchCreate,
	getInverterGenerationData,
	getSiteAllInvertersGenerationData,
	getLatestSitePower,
	batchCreateSitePower,
	updateSitePowerWithInverterData,
	getLatestPositiveSitePower,
	batchCreateSitePowerUpsert
}

