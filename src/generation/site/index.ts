import { dbClient } from '../../db/pool'
import { serialize as serializeInverterData } from '..'
import { camelToSnake } from '../../utils/camelSnake'
import { SiteGenerationTimeseries} from '@autonomy-power/types'
import { GenerationTimeseries } from '@autonomy-power/types'

const GENERATION_QUERY_STRING_BY_TIME_UNIT = {
	[TimeseriesEnum.Hour]: `
	SELECT
	site_id,
	time,
	g_ac AS "g_ac",
	g_dc AS "g_dc"
	FROM site_generation_hour_timeseries
	WHERE
	site_id=$1 AND
	time BETWEEN $2 AND $3
	ORDER BY time ASC
`,
	[TimeseriesEnum.Day]: `
	SELECT
	time,
	g_ac AS "g_ac",
	g_dc AS "g_dc"
	FROM site_generation_day_timeseries
	WHERE
	(
		site_id=$1 AND
		("time" BETWEEN $2 AND $3)
	)
	ORDER BY time ASC
	`,
	[TimeseriesEnum.Minute]: `
	SELECT
	site_id,
	time,
	g_ac AS "g_ac",
	g_dc AS "g_dc"
	FROM site_generation_timeseries
	WHERE
	site_id=$1 AND
	time BETWEEN $2 AND $3
	ORDER BY time ASC
	`
}


export const serialize = (rows: Array<any>): Array<SiteGenerationTimeseries> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'siteId': '',
			'time': '',
			'g_ac': 0,
			'g_dc': 0,
			'interval': 60
		}
		for (const key in rowCopy) {
			if (['g_ac', 'g_dc'].includes(key)) {
				rowCopy[key] = row[key.toLocaleLowerCase()]
			}

			else if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}

		}
		return rowCopy
	})
	return serialized
}


export const create = async (newSiteGenerationTimeseries: SiteGenerationTimeseries): Promise<SiteGenerationTimeseries> => {
	const { siteId, g_ac, interval, time } = newSiteGenerationTimeseries
	const query = `
	INSERT INTO site_generation_timeseries (site_id, time, g_ac, interval)
	VALUES ($1, $2, $3, $4 )`
	await dbClient.query(query, [siteId, time, g_ac, interval])
	return newSiteGenerationTimeseries
}

const getGeneration = async (
	siteId: string, start: string, end: string, unit: TimeseriesEnum
): Promise<Array<SiteGenerationTimeseries>> => {
	const values = [siteId, start, end]
	const qs = GENERATION_QUERY_STRING_BY_TIME_UNIT[unit] || GENERATION_QUERY_STRING_BY_TIME_UNIT[TimeseriesEnum.Day]
	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

const getSiteGenerationForHourPeriod =
	async (siteId: string, startDate: string, endDate: string, startHour: string, endHour: string)
		: Promise<Array<SiteGenerationTimeseries>> => {

		const values = [siteId, startDate, endDate, startHour, endHour]
		const qs = `
	SELECT
	site_id, time, g_ac, g_dc from
	site_generation_hour_timeseries
	WHERE site_id=$1
	AND time  between $2 AND $3
	AND extract(hour from time) between $4 AND $5;
	`
		const res = await dbClient.query(qs, values)
		const timestamps = serialize(res.rows)
		return timestamps

	}

const getTotalSiteGenerationForHourPeriod = async (
	siteId: string,
	startDate: string,
	endDate: string,
	startHour: string,
	endHour: string,
): Promise<{ value: number, count: number }> => {
	const values = [siteId, startHour, endHour]
	const qs = `
		select  SUM(g_ac) AS g_ac, COUNT(*)
		FROM site_generation_hour_timeseries
		WHERE site_id=$1
		AND extract(hour from time) between $2 AND $3
	`


	// select  SUM(g_ac) from site_generation_hour_timeseries
	// where site_id='7eab91b0-131b-11eb-9780-99cb1ad358dd'
	// AND extract(hour from time) between 10 AND 11 ;
	const res = await dbClient.query(qs, values)
	const totalGeneration = res.rows[0].g_ac
	const count = res.rows[0].count
	return { value: Number(totalGeneration), count }

}


const getSiteFirstTimestamp = async (siteId: string): Promise<SiteGenerationTimeseries> => {
	const qs = `
	SELECT
	time,
	g_ac AS "g_ac",
	g_dc AS "g_dc",
	site_id FROM site_generation_timeseries
	WHERE site_id=$1
	ORDER BY time ASC
	LIMIT 1
	`

	const res = await dbClient.query(qs, [siteId])
	const firstTimestamp = serialize(res.rows)[0]
	return firstTimestamp
}

const getMonthlyGeneration = async (siteId: string, start: string, end: string)
	: Promise<Array<SiteGenerationTimeseries>> => {
	const values = [siteId, start, end]
	const qs = `
		SELECT
		time,
		g_ac AS "g_ac",
		g_dc AS "g_dc"
		FROM site_generation_monthly
		WHERE
		(
			site_id=$1 AND
			("time" BETWEEN $2 AND $3)
		)
		ORDER BY time ASC
		`
	const res = await dbClient.query(qs, values)
	const rows = res.rows
	return serialize(rows)
}

export const batchCreate = async (newSiteGenerationTimeseriess: Array<SiteGenerationTimeseries>): Promise<boolean> => {
	try {
		const qs = `
			INSERT INTO site_generation (site_id, time, g_ac, interval)
			SELECT * FROM UNNEST ($1::text[], $2::timestamp[],$3::float[],$4::int[])
		`
		await dbClient.query(
			qs, compartiment(newSiteGenerationTimeseriess)
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

const getSiteGenerationData = async (siteId: string, interval: TimeSeriesUnitType, start: string, end: string)
	: Promise<Array<SiteGenerationTimeseries>> => {
	const values = [start, end, siteId]
	const qs = `
		SELECT time_bucket('${getTimeSeriesSeconds(interval)} seconds', time)
		AS interval,
		g.g_ac,  g.g_dc, time, COUNT(*)
		FROM site_generation_timeseries g
		WHERE
		time > $1
		AND g.time < $2
		AND site_id=$3
		GROUP BY time, interval, g.g_ac, g.g_dc
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
		SELECT time_bucket('${interval}', g.time)
		AS "time",
		SUM(g.g_ac) as g_ac,
		SUM(g.g_dc) as g_dc,
		site_id,
		device_id
		FROM inverter_generation_timeseries g
		INNER JOIN device d
		ON g.device_id=d.name
		AND d.site_id=$1
		AND g.time BETWEEN $2 AND $3
		GROUP BY time
		ORDER BY time
	`

	const res = await dbClient.query(qs, values)
	const rows = res.rows

	return serializeInverterData(rows)
}

const compartiment = (arr: Array<SiteGenerationTimeseries>) => {
	const final = [[], [], [], []]
	arr.forEach(t => {
		final[0].push(t.siteId)
		final[1].push(t.time)
		final[2].push(t.g_ac)
		final[3].push(t.interval)
	})
	return final
}

export const getAllForSite = async (siteId: string, interval: TimeSeriesUnitType, start: string, end: string)
	: Promise<Array<SiteGenerationTimeseries>> => {
	const values = [start, end, siteId]
	const targetTable = interval === 'day' ? 'site_generation_day_timeseries' :
		interval === 'hour' ? 'site_generation_hour_timeseries' :
			interval === 'month' ? 'site_generation_month_timeseries' :
				interval === 'minute' ? 'site_generation_timeseries' : ''
	const qs = `
	SELECT
	g.P_AC, g.P_DC, time
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

export default {
	create,
	batchCreate,
	getSiteAllInvertersGenerationData,
	getSiteGenerationData,
	getMonthlyGeneration,
	getGeneration,
	getSiteGenerationForHourPeriod,
	getTotalSiteGenerationForHourPeriod,
	getSiteFirstTimestamp,
	getAllForSite
}
