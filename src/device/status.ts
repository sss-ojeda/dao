import { DeviceStatus } from '@autonomy-power/types'
import { searchQueryBuilder } from '../db/queryBuilder'
import { camelToSnake } from '../utils/camelSnake'
import { dbClient } from '../db'
const columnNames = [
	'device_id',
	'description',
	'time',
	'is_active',
]

export const serialize = (rows: Array<any>): Array<DeviceStatus> => {
	const serialized = rows.map((row) => {
		const rowCopy = {
			deviceId: '',
			description: '',
			time: '',
			isActive: false,
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

export const getLatestDeviceStatus = async (deviceId: string) : Promise<DeviceStatus> => {
	const qs = `
SELECT * FROM device_status_history WHERE device_id=$1 ORDER BY TIME DESC LIMIT 1
`

	const res = await dbClient.query(qs, [deviceId])
	if(res.rows.length === 0){
		throw new Error('device does not have any alert')
	}
	return serialize(res.rows)[0]

}

export const addDeviceStatus = async (deviceStatus: DeviceStatus) : Promise<DeviceStatus> => {
	const  {deviceId, description, time, isActive} = deviceStatus
	const qs = `
	INSERT INTO device_status_history(
		device_id, description, time, is_active)
	VALUES ($1, $2, $3, $4)
	`
	await dbClient.query(qs, [deviceId, description, time, isActive])
	return deviceStatus
}

export const getAllDeviceStatus = async (deviceId: string, options?: SearchOptions) : Promise<Array<DeviceStatus>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'device_status_history',
		[...columnNames],
		options,
		1
	)

	const qs = `
	SELECT * FROM  device_status_history
		WHERE device_id = $1
		${queryOptions}
	`

	const res = await dbClient.query(qs, [deviceId, ...values])
	return serialize(res.rows)

}


export default { getAllDeviceStatus, addDeviceStatus, getLatestDeviceStatus}
