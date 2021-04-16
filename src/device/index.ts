import { dbClient } from '../db'
import { searchQueryBuilder } from '../db/queryBuilder'
import { camelToSnake } from '../utils/camelSnake'
import inverterDao from './inverter'
import {v4 as uuid} from 'uuid'
import status from './status'
const columnNames = [
	'name',
	'type',
	'site_id',
	'brand',
	'model',
	'id'
]

export const serialize = (rows: Array<any>): Array<Device> => {
	const serialized = rows.map((row) => {
		const rowCopy = {
			name: '',
			type: '',
			siteId: '',
			brand: '',
			model: '',
			id: ''
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


export const deviceIdExists = async (deviceId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from device where  name=$1)',
		[deviceId]
	)
	return res.rows[0].exists

}

export const deviceNameExistsInSite = async (deviceName:string, siteId: string): Promise<boolean> => {

	const res = await dbClient.query(
		'select exists(select 1 from device where  name=$1 AND site_id=$2)',
		[deviceName, siteId]
	)
	return res.rows[0].exists

}

export const create = async (newDevice: Device): Promise<string> => {


	const deviceType = newDevice.type
	const { brand, model, siteId } = newDevice
	const id = uuid()
	const deviceName = newDevice.name
	const queryStr = `
		INSERT INTO device(id, name, type, brand, model, site_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	await dbClient.query(queryStr, [id, deviceName, deviceType, brand, model, siteId])
	return id

}


export const deleteOne = async (deviceId: string): Promise<boolean> => {
	await dbClient.query('DELETE FROM device where id=$1', [deviceId])
	return true
}


export const getAllBySite = async (siteId: string, options: SearchOptions): Promise<Array<Device>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'device',
		[...columnNames],
		options,
		1
	)
	const query = `
		SELECT * FROM  device
		WHERE site_id = $1
		${queryOptions}`
	const res = await dbClient.query(query, [siteId, ...values])
	return serialize(res.rows)
}


export const getAllCountBySite = async (siteId: string, _options: SearchOptions): Promise<number> => {
	const query = `
		SELECT COUNT(*) FROM device
		WHERE site_id = $1
	`
	const res = await dbClient.query(query, [siteId])
	return res.rows[0].count
}

export const getAllInverters = async (siteId: string, options: SearchOptions): Promise<Array<Device>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'device',
		[...columnNames],
		options,
		1
	)
	const query = `
		SELECT * FROM  device
		WHERE site_id = $1
		AND type='inverter'
		${queryOptions}
	`
	const res = await dbClient.query(query, [siteId, ...values])
	return serialize(res.rows)
}


const getCount = async (): Promise<number> => {
	const qs = `
		SELECT COUNT(*) FROM device
	`
	const res = await dbClient.query(qs)
	return res.rows[0].count
}


const getSearchCount = async (searchTerm: string): Promise<number> => {
	const qs = `
		SELECT COUNT(*) FROM device r
		WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}


const search = async (searchTerm: string, options): Promise<Array<Device>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'device',
		[...columnNames],
		options,
		1
	)

	const queryStr = `
		SELECT
		name,description,is_closed,created_at
		FROM
		WHERE LOWER(r.name) LIKE  LOWER($1)
		${queryOptions}
	`

	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(queryStr, [searchValue, ...values])
	return serialize(res.rows)
}


const addAlert = async (
	deviceId: string,
	alertId: string
): Promise<boolean> => {
	const queryStr = `
		INSERT INTO device_alert(device_id, alert_id)
		VALUES($1, $2)
	`
	await dbClient.query(queryStr, [deviceId, alertId])
	return true
}


export const getOrCreateDevice = async (newDevice: Device): Promise<Device> => {
	const { brand, model, siteId,type } = newDevice
	const id = uuid()
	const deviceName = newDevice.name
	const queryStr = `
		SELECT * from device WHERE name=$1 AND
		type=$2 AND brand=$3 AND model=$4 AND site_id=$5
	`
	const res = await dbClient.query(queryStr, [deviceName, type, brand, model, siteId])
	if (res.rows.length === 0) {
		const queryStr = `
		INSERT INTO device(id, name, type, brand, model, site_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		`
		await dbClient.query(queryStr, [id, deviceName, type, brand, model, siteId])
		return {...newDevice, id}
	} else {

		return serialize(res.rows)[0]
	}
}
export const getInfo = async (deviceId: string): Promise<Device> => {
	const queryStr = `
		SELECT * from device WHERE id=$1
	`
	const res = await dbClient.query(queryStr, [deviceId])
	const device = serialize(res.rows)[0]

	return device
}


export default {
	addAlert,
	getInfo,
	deleteOne,
	create,
	getCount,
	search,
	getSearchCount,
	deviceIdExists,
	getAllBySite,
	getOrCreateDevice,
	getAllCountBySite,
	deviceNameExistsInSite,
	getAllInverters,
	inverter: inverterDao,
	status
}
