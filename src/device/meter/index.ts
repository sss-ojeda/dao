import { dbClient } from '../../db'
import { camelToSnake } from '../../utils/camelSnake'
import {Meter, NMIMeter, MeterTimeseries} from '@autonomy-power/types'
import {v4 as uuid } from 'uuid'
import {serialize as serializeDevice} from '../index'
import format from 'pg-format'

export const serialize = (rows: Array<any>): Array<Meter> => {
	const serialized = rows.map(row => {
		const rowCopy: Meter = {
			type: '',
			id: '',
			siteId:'',
			name:''
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

export const serializeNMIMeter = (rows: Array<any>): Array<NMIMeter> => {
	const serialized = rows.map(row => {
		const rowCopy: NMIMeter = {
			meterId: '',
			number:'',
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


export const getAllMetersForSite = async (siteId: string) : Promise<Array<Meter>> => {
	const qs = 'SELECT * from meter where site_id=$1'
	const res = await dbClient.query(qs, [siteId])
	return serialize(res.rows)
}

export const getAllMetersForSiteAsDevice = async (siteId: string) : Promise<Array<Device>> => {
	const qs = 'SELECT * from meter where site_id=$1'
	const res = await dbClient.query(qs, [siteId])
	const meters = serializeDevice(res.rows)

	return meters
}

// const getDeviceNameFromMeter = ()
export const getNMIMeterInfoByMeterId = async (meterId: string) : Promise<NMIMeter> => {
	const qs = 'SELECT * from nmi_meter where meter_id=$1'
	const res = await dbClient.query(qs, [meterId])
	return serializeNMIMeter(res.rows)[0]
}

export const getNMIMeterInfo = async (meterId: string) : Promise<NMIMeter> => {
	const qs = 'SELECT * from nmi_meter where number=$1'
	const res = await dbClient.query(qs, [meterId])
	return serializeNMIMeter(res.rows)[0]
}

export const createMeter = async (meter:Meter): Promise<Meter> => {
	const {type, siteId, name} = meter
	const id  = uuid()
	const qs = `
	INSERT INTO meter(id,type, site_id, name)
	VALUES ($1, $2, $3, $4)`
	await dbClient.query(qs, [id, type, siteId, name])
	return  {id, type, siteId, name}
}

export const addNMI = async (nmiMeter: NMIMeter): Promise<boolean> => {
	const {meterId, number} = nmiMeter
	const qs = `
	INSERT INTO site_nmi(meter_id, number)
	VALUES ($1, $2)`
	await dbClient.query(qs, [meterId, number])
	return true
}

export const batchCreateMeterTS = async ( meterTimeseries: Partial<MeterTimeseries & { time: string; interval: number; device_id: string; }>[]): Promise<boolean> => {
	if (meterTimeseries.length === 0) {
		return
	}

	const dataToInsert = meterTimeseries.map(
		({ E, B, K, Q, time, interval, meterId }) =>
			[
				E || null,
				B || null,
				Q || null,
				K || null,
				time || null,
				interval || null,
				meterId || null
			],
	)


	const sqlQuery = format(
		`INSERT INTO meter_timeseries
		(
			E, B, K, Q,
			time, interval, meter_id
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

export const matchAllSitesDataToMeter = async () => {
	const qs = `
	INSERT INTO site_meter_timeseries (interval, time, site_id, E , B , K , Q )
	 (
		SELECT interval, time, site_id, SUM(E) as E, SUM(B) as B, SUM(K) AS K, SUM(Q) AS Q from meter_timeseries
		INNER JOIN meter
		ON meter.id = meter_timeseries.meter_id
		INNER JOIN  site
		ON site.id = meter.site_id
		GROUP BY site_id, time, interval
	)
	ON CONFLICT DO NOTHING
	`
	await dbClient.query(qs)
}

export const meterDao = {
	getAllMetersForSite,
	getNMIMeterInfo,
	getAllMetersForSiteAsDevice,
	getNMIMeterInfoByMeterId,
	batchCreateMeterTS,
	matchAllSitesDataToMeter,
	createMeter,
	addNMI
}
