import { v4 as uuid } from 'uuid'
import { dbClient } from '../db'
import { searchQueryBuilder } from '../db/queryBuilder'
import { serialize as serializeSite } from '../site'
import { camelToSnake } from '../utils/camelSnake'

import {Alert, SearchOptions, Site} from '@autonomy-power/types'
const columnNames = [
	'name',
	'created_at',
	'id',
	'description',
	'state',
	'device_id',
	'plant',
]


const serialize = (rows: Array<any>): Array<Alert> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'state': '',
			'deviceId': '',
			'device': {
				name: '',
				type: '',
				siteId: ''
			},
			'plant': '',
			'name': '',
			'createdAt': '',
			'description': '',
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


export const getAll = async (options: SearchOptions): Promise<Array<Alert>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options)

	const queryStr = `
		SELECT
		a.id, a.created_at, a.description, a.state, a.device_id, a.plant
		FROM
		alert a
		${queryOptions}
	`

	const res = await dbClient.query(queryStr, values)
	const alerts = serialize(res.rows)

	await Promise.all(alerts.map(async alert => {
		alert.plant = await getAlertSiteName(alert)
	}))

	return alerts
}

export const getAllBySite = async (siteId: string, options: SearchOptions): Promise<Array<Alert>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options,1)

	const queryStr = `
		SELECT
		a.id, a.created_at, a.description, a.state, a.device_id, a.plant
		FROM 	alert a INNER JOIN device d ON
		a.device_id=d.id AND
		d.site_id=$1
		${queryOptions}
	`

	const res = await dbClient.query(queryStr, [siteId, ...values])
	const alerts = serialize(res.rows)

	await Promise.all(alerts.map(async alert => {
		alert.plant = await getAlertSiteName(alert)
	}))

	return alerts
}
export const getCountBySite = async (siteId: string): Promise<number> => {
	const qs = `
		SELECT COUNT(*) FROM alert a INNER JOIN device d ON
		a.device_id=d.id AND
		d.site_id=$1
	`
	const res = await dbClient.query(qs, [siteId])
	return res.rows[0].count
}


const getCount = async (_options: SearchOptions): Promise<number> => {
	const qs = `
		SELECT COUNT(*) FROM alert
	`
	const res = await dbClient.query(qs)
	return res.rows[0].count
}


export const create = async (newAlert: Alert): Promise<string> => {
	const { createdAt, description, state, deviceId, plant } = newAlert
	const id = uuid()
	const query = `
		INSERT INTO alert(id, created_at, description, state, device_id, plant)
		VALUES ($1, $2::timestamptz,$3, $4, $5,$6)
	`
	const res = await dbClient.query(query, [id, createdAt, description, state, deviceId, plant])
	const siteId = res.rows[0].id
	return siteId
}

export const upsert = async (newAlert: Alert): Promise<string> => {
	const { createdAt, description, state, deviceId, plant } = newAlert
	const id = uuid()
	const query = `
		WITH input_rows(id, created_at, description, state, device_id, plant) AS (
			VALUES
				 ($1, $2::timestamptz, $3, $4, $5, $6)
			)
	 , ins AS (
			INSERT INTO alert (id, created_at, description, state, device_id, plant)
			SELECT * FROM input_rows
			ON CONFLICT (created_at, description, state, device_id, plant) DO NOTHING
			RETURNING id
			)
	 SELECT 'i' AS source
				, id
	 FROM   ins
	 UNION  ALL
	 SELECT 's' AS source
				, c.id
	 FROM   input_rows
	 JOIN   alert c USING (created_at, description, state, device_id, plant)
	`
	const res = await dbClient.query(query, [id, createdAt, description, state, deviceId, plant])
	return res.rows[0].id
}


export const getLatest = async (): Promise<Date> => {
	const query = `
		SELECT created_at
		FROM alert
		ORDER BY created_at DESC
		LIMIT 1
	`
	const res = await dbClient.query(query)
	if (res.rows[0]) {
		return new Date(res.rows[0].created_at)
	}

	return null
}


const getSearchCount = async (searchTerm: string, _options): Promise<number> => {
	const qs = `
		SELECT COUNT(*) FROM alert  r
		WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}


const search = async (searchTerm: string, options): Promise<Array<Alert>> => {
	const { queryOptions, values } = searchQueryBuilder('alert', [...columnNames], options, 1)

	const queryStr = `
		SELECT
		a.id, a.created_at, a.description,
		a.state, a.deviceId, a.plant
		FROM alert a
		WHERE
		(
			LOWER (a.description) LIKE  LOWER($1)
			OR  LOWER (a.deviceId) LIKE  LOWER($1)
			OR  LOWER (a.plant) LIKE  LOWER($1)
		)
		${queryOptions}
	`

	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(queryStr, [searchValue, ...values])
	const alerts = serialize(res.rows)
	await Promise.all(alerts.map(async alert => {
		alert.plant = await getAlertSiteName(alert)
	}))

	return serialize(res.rows)
}


export const alertExists = async (alert: Alert) : Promise<boolean> => {
	const { createdAt, description, deviceId, plant } = alert
	const values = [ description, plant, createdAt, deviceId]
	const qs = `
	select EXISTS(select 1 from alert where  description=$1 AND plant=$2 AND created_at=$3 AND device_id=$4)
	`

	const res = await dbClient.query(qs, values)

	return res.rows[0].exists
}

export const getAllByTicket = async (ticketId: string, options?: SearchOptions): Promise<Array<Alert>> => {
	if(options) {
		const { queryOptions, values } = searchQueryBuilder('alert', [...columnNames], options, 1)

		const queryStr = `
		SELECT
		a.id, a.created_at, a.description, a.state, a.device_id, a.plant
		FROM
		alert a INNER JOIN ticket_alert ta
		ON (ta.ticket_id = $1 AND a.id = ta.alert_id)
		${queryOptions}
	`

		const res = await dbClient.query(queryStr, [ticketId, ...values])
		const alerts = serialize(res.rows)
		await Promise.all(alerts.map(async alert => {
			alert.plant = await getAlertSiteName(alert)
		}))

		return alerts
	} else {
		const queryStr = `
		SELECT
		a.id, a.created_at, a.description, a.state, a.device_id, a.plant
		FROM
		alert a INNER JOIN ticket_alert ta
		ON (ta.ticket_id = $1 AND a.id = ta.alert_id)
	`

		const res = await dbClient.query(queryStr, [ticketId])
		const alerts = serialize(res.rows)
		await Promise.all(alerts.map(async alert => {
			alert.plant = await getAlertSiteName(alert)
		}))

		return alerts
	}
}


const getAllCountByTicket = async (ticketId): Promise<number> => {
	const queryStr = `
		SELECT
		count(*)
		FROM
		alert a INNER JOIN ticket_alert ta
		ON (ta.ticket_id = $1 AND a.id = ta.alert_id)
	`
	const res = await dbClient.query(queryStr, [ticketId])
	return res.rows[0].count
}


export const getAllByDevice = async (deviceId: string, options: SearchOptions): Promise<Array<Alert>> => {
	const { queryOptions, values } = searchQueryBuilder('alert', [...columnNames], options, 1)
	const queryStr = `
		SELECT
		a.id, a.created_at, a.description, a.state, a.device_id, a.plant
		FROM
		alert a
		WHERE device_id=$1
		${queryOptions}
	`

	const res = await dbClient.query(queryStr, [deviceId, ...values])
	const alerts = serialize(res.rows)
	await Promise.all(alerts.map(async alert => {
		alert.plant = await getAlertSiteName(alert)
	}))

	return alerts
}


const getAllCountByDevice = async (deviceId): Promise<number> => {
	const queryStr = `
		SELECT
		count(*)
		FROM
		alert  WHERE device_id=$1
	`
	const res = await dbClient.query(queryStr, [deviceId])
	return res.rows[0].count
}


const getAlertSiteName = async (alert: Alert): Promise<string> => {
	const { deviceId } = alert
	const qs = `
		SELECT site.name
		FROM site
		JOIN device
		ON site.id=device.site_id
		AND device.name=$1
	`

	const res = await dbClient.query(qs, [deviceId])

	if (!res.rows[0])
		return ''
	return res.rows[0].name

}



export const getSite = async (plant: string): Promise<Site> => {
	const queryStr = `
		SELECT * from site WHERE name=$1
	`
	const res = await dbClient.query(queryStr, [plant])
	const site = serializeSite(res.rows)[0]

	return site
}


export default {
	create,
	getLatest,
	getCount,
	getAll,
	search,
	getSearchCount,
	getSite,
	getAllByTicket,
	getAllCountByTicket,
	getAllCountByDevice,
	getAllByDevice,
	getAllBySite,
	alertExists,
	getCountBySite,
	upsert

}
