import {ABBLogger, ABBDevice} from '@autonomy-power/types'
import { dbClient } from '../../db'
import { camelToSnake } from '../../utils/camelSnake'


export const serializeABBLogger = (rows: Array<any>): Array<ABBLogger> => {
	const serialized = rows.map(row => {
		const rowCopy: ABBLogger = {
			loggerEntityID: '',
			loggerName: '',
			loggerDescription: '',
			loggerState: '',
			loggerMACAddress: '',
			loggerManufacturer: '',
			loggerModel: '',
			deviceId: '',
		}
		for (const key in rowCopy) {
			switch(key){
				case 'deviceFWVersion':
				case 'loggerEntityID':
					rowCopy['loggerEntityID'] = row['logger_entity_id']
					break
				case 'loggerMACAddress':
					rowCopy[key] = row['logger_mac_address']
					break
				default :
					if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
						rowCopy[key] = row[camelToSnake(key)]
					}
			}
		}

		return rowCopy
	})
	return serialized
}

export const serializeABBDevice = (rows: Array<any>): Array<ABBDevice> => {
	const serialized = rows.map(row => {
		const rowCopy: ABBDevice = {
			deviceId: '',
			deviceEntityID: '',
			deviceCategory: '',
			deviceName: '',
			deviceDescription: '',
			deviceState: '',
			deviceSerialNumber: '',
			deviceManufacturer: '',
			deviceModel: '',
			deviceFWVersion: '',
			deviceCommunicationInterface: '',
			deviceRS485Address: '',
			deviceFirstReportedDate: '',
			abbLoggerEntityId: ''
		}
		for (const key in rowCopy) {
			switch(key){
				case 'deviceFWVersion':
					rowCopy['deviceFWVersion'] = row['device_fw_version']
					break

				case 'deviceEntityID':
					rowCopy['deviceEntityID'] = row['device_entity_id']
					break
				case 'deviceRS485Address':
					rowCopy['deviceRS485Address'] = row['device_rs485_Address']
					break
				default :
					if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
						rowCopy[key] = row[camelToSnake(key)]
					}

			}

		}
		return rowCopy
	})
	return serialized
}

export const saveABBDevice =  async (abbDevice: ABBDevice) => {
	const {		deviceId,
		deviceEntityID,
		deviceCategory,
		deviceName,
		deviceDescription,
		deviceState,
		deviceSerialNumber,
		deviceManufacturer,
		deviceModel,
		deviceFWVersion,
		deviceCommunicationInterface,
		deviceRS485Address,
		deviceFirstReportedDate,
		abbLoggerEntityId} = abbDevice

	const values = [
		deviceId,
		deviceEntityID,
		deviceCategory,
		deviceName,
		deviceDescription,
		deviceState,
		deviceSerialNumber,
		deviceManufacturer,
		deviceModel,
		deviceFWVersion,
		deviceCommunicationInterface,
		deviceRS485Address,
		deviceFirstReportedDate,
		abbLoggerEntityId]
	const qs = `
	INSERT INTO abb_device  (	device_id,
		device_entity_ID,
		device_category,
		device_name,
		device_description,
		device_state,
		device_serial_number,
		device_manufacturer,
		device_model,
		device_FW_version,
		device_communication_interface,
		device_RS485_Address,
		device_First_Reported_Date,
		abb_logger_entity_id)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
	await dbClient.query(qs, values)
	return true
}
export const saveABBLogger = async (abbLogger: ABBLogger) => {
	const {
		loggerEntityID,
		loggerName,
		loggerDescription,
		loggerState,
		loggerMACAddress,
		loggerManufacturer,
		loggerModel,
		deviceId} = abbLogger
	const qs = `
	INSERT INTO abb_logger
	(
		logger_entity_id,
		logger_name,
		logger_description,
		logger_state,
		logger_mac_address,
		logger_manufacturer,
		logger_model,
		device_id
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	await dbClient.query(qs, [loggerEntityID,
		loggerName,
		loggerDescription,
		loggerState,
		loggerMACAddress,
		loggerManufacturer,
		loggerModel,
		deviceId])
	return true
}



export const getSiteABBLoggers = async (siteId:string): Promise<Array<ABBLogger>> => {
	const qs = `SELECT * from abb_logger
	INNER JOIN device
	ON device.site_id=$1
	AND device.id=abb_logger.device_id`
	const res = await dbClient.query (qs, [siteId])

	return serializeABBLogger(res.rows)
}

export const getSiteABBDevices = async (siteId:string): Promise<Array<ABBDevice>> => {
	const qs = `
	SELECT * from abb_device
	INNER JOIN device
	ON device.site_id=$1
	AND device.id=abb_device.device_id`
	const res = await dbClient.query(qs, [siteId])

	return serializeABBDevice (res.rows)
}


export const abbDeviceEntityIdExists = async (abbEntityId:string) : Promise<ABBDevice> => {
	const qs = `
	select exists(	SELECT 1 FROM abb_device
	WHERE device_entity_id=$1)`

	const res = await dbClient.query(qs, [abbEntityId])
	return res.rows[0].exists
}

export const getABBDeviceByEntityId = async (abbEntityId:string) : Promise<ABBDevice> => {
	const qs = `
	SELECT * FROM abb_device
	WHERE device_entity_id=$1`
	const res = await dbClient.query(qs, [abbEntityId])
	return serializeABBDevice(res.rows)[0]
}
export const getABBLoggerByEntityId = async (abbEntityId:string) : Promise<ABBDevice> => {
	const qs = `
	SELECT * FROM abb_logger
	WHERE logger_entity_id=$1`
	const res = await dbClient.query(qs, [abbEntityId])
	return serializeABBDevice(res.rows)[0]
}


export const abbDevice = {
	getSiteABBDevices,
	getSiteABBLoggers,
	saveABBDevice,
	saveABBLogger,
	getABBLoggerByEntityId,
	getABBDeviceByEntityId,
	abbDeviceEntityIdExists
}
