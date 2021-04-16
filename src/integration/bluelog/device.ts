import { BluelogDevice} from '@autonomy-power/types'
import { dbClient } from '../../db'
import { camelToSnake } from '../../utils/camelSnake'



export const serializeBluelogDevice = (rows: Array<any>): Array<BluelogDevice> => {
	const serialized = rows.map(row => {
		const rowCopy: BluelogDevice = {
			deviceId: '',
			blId: '',
			name: '',
			model: '',
			driver: '',
			address: '',
			interfaceType: '',
			vendor: '',
			type: '',
			firmware: '',
			serial: '',
			interfaceAddress:'',
			loggerId: ''
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

export const saveBluelogDevice =  async (blDevice: BluelogDevice) => {
	const {
		deviceId,
		blId,
		name,
		model,
		driver,
		interfaceType,
		vendor,
		type,
		firmware,
		interfaceAddress, serial, address, loggerId } = blDevice

	const values = [
		deviceId,
		blId,
		name,
		model,
		driver,
		interfaceType,
		vendor,
		type,
		firmware,
		interfaceAddress, serial, address, loggerId]
	const qs = `
	INSERT INTO bluelog_device  (
		device_id,
		bl_id,
		name,
		model,
		driver,
		interface_type,
		interface_address,
		vendor,
		type,
		firmware, serial, address, logger_id)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
	await dbClient.query(qs, values)
	return true
}


export const getSiteBluelogDevices = async (siteId:string): Promise<Array<BluelogDevice>> => {
	const qs = `
	SELECT * from bluelog_device
	INNER JOIN device
	ON device.site_id=$1
	AND device.id=bluelog_device.device_id`
	const res = await dbClient.query(qs, [siteId])

	return serializeBluelogDevice (res.rows)
}


export const bluelogDeviceIdExists = async (bluelogId:string) : Promise<BluelogDevice> => {
	const qs = `
	select exists(	SELECT 1 FROM bluelog_device
	WHERE device_entity_id=$1)`

	const res = await dbClient.query(qs, [bluelogId])
	return res.rows[0].exists
}

export const getBluelogDeviceById = async (bluelogId:string) : Promise<BluelogDevice> => {
	const qs = `
	SELECT * FROM bluelog_device
	WHERE device_entity_id=$1`
	const res = await dbClient.query(qs, [bluelogId])
	return serializeBluelogDevice(res.rows)[0]
}


export const blDevice = {
	getSiteBluelogDevices,
	saveBluelogDevice,
	getBluelogDeviceById,
	bluelogDeviceIdExists
}
