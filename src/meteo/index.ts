import {MeteoData} from '@autonomy-power/types'
import { QueryResult } from 'pg'
import format from 'pg-format'
import { dbClient } from '../db'

export const getForSite = async (siteId: string, start: string, end: string, interval: string): Promise<any[]> => {
	const targetTable = interval === 'day' ? 'meteo_day_timeseries' :
		interval === 'hour' ? 'meteo_hour_timeseries' :
			interval === 'minute' ? 'meteo_timeseries' : ''

	const query = `
		SELECT * FROM ${targetTable}
		WHERE site_id=$1
		AND time BETWEEN $2 AND $3
		ORDER BY time
	`

	const meteodata = await dbClient.query(query, [siteId, start, end])
	return meteodata.rows
}

export const getAllDeviceMeteo = async (siteId: string, start: string, end: string, interval: string): Promise<any[]> => {
	const targetTable =
		interval === 'day' ? 'device_meteo_day_timeseries' :
			interval === 'hour' ? 'device_meteo_hour_timeseries' :
				'device_meteo_timeseries'

	const query = `
		SELECT * FROM ${targetTable}
		WHERE site_id=$1
		AND time BETWEEN $2 AND $3
		ORDER BY time
	`

	return (await dbClient.query(query, [siteId, start, end])).rows
}

const batchCreateBLMeteoDataTimestamp = async (site_id: string, meteoData: Partial<MeteoData & { time: string; interval: number; device_id: string; }>[]): Promise<QueryResult> => {
	if (meteoData.length === 0) {
		return
	}

	const {
		SRAD,
		E_AH_REL1,
		E_AP_REL1,
		E_W_D,
		E_PRECIPITATION,
		E_W_S,
		E_W_S_MAX,
		E_RF_DIF,
		E_RF_I1,
		E_AH_ABS1,
		E_AP_ABS1,
		PANEL_TEMPERATURE,
		AMBIENT_TEMPERATURE,
		totalSRAD,
		totalE_AH_REL1,
		totalE_AP_REL1,
		totalE_W_D,
		totalE_PRECIPITATION,
		totalE_W_S,
		totalE_W_S_MAX,
		totalE_RF_DIF,
		totalE_RF_I1,
		totalE_AH_ABS1,
		totalE_AP_ABS1,
		totalPANEL_TEMPERATURE,
		totalAMBIENT_TEMPERATURE,
		interval,
		time,
	} = (meteoData || []).reduce((prev: any, curr) => {
		return {
			...prev,
			time: prev.time ? prev.time : curr.time ? curr.time : '',
			interval: prev.interval ? prev.interval : curr.interval ? curr.interval : '',
			device_id: prev.device_id ? prev.device_id : curr.device_id ? curr.device_id : '',
			SRAD: prev.SRAD + (curr.SRAD || 0),
			E_AH_REL1: prev.E_AH_REL1 + (curr.E_AH_REL1 || 0),
			E_AP_REL1: prev.E_AP_REL1 + (curr.E_AP_REL1 || 0),
			E_W_D: prev.E_W_D + (curr.E_W_D || 0),
			E_PRECIPITATION: prev.E_PRECIPITATION + (curr.E_PRECIPITATION || 0),
			T: prev.T + (curr.T || 0),
			E_W_S: prev.E_W_S + (curr.E_W_S || 0),
			E_W_S_MAX: prev.E_W_S_MAX + (curr.E_W_S_MAX || 0),
			E_RF_DIF: prev.E_RF_DIF + (curr.E_RF_DIF || 0),
			E_RF_I1: prev.E_RF_I1 + (curr.E_RF_I1 || 0),
			E_AH_ABS1: prev.E_AH_ABS1 + (curr.E_AH_ABS1 || 0),
			E_AP_ABS1: prev.E_AP_ABS1 + (curr.E_AP_ABS1 || 0),
			PANEL_TEMPERATURE: prev.PANEL_TEMPERATURE + (curr.PANEL_TEMPERATURE || 0),
			AMBIENT_TEMPERATURE: prev.AMBIENT_TEMPERATURE + (curr.AMBIENT_TEMPERATURE || 0),

			totalSRAD: curr.SRAD ? prev.totalSRAD + 1 : prev.totalSRAD,
			totalE_AH_REL1: curr.E_AH_REL1 ? prev.totalE_AH_REL1 + 1 : prev.totalE_AH_REL1,
			totalE_AP_REL1: curr.E_AP_REL1 ? prev.totalE_AP_REL1 + 1 : prev.totalE_AP_REL1,
			totalE_W_D: curr.E_W_D ? prev.totalE_W_D + 1 : prev.totalE_W_D,
			totalE_PRECIPITATION: curr.E_PRECIPITATION ? prev.totalE_PRECIPITATION + 1 : prev.totalE_PRECIPITATION,
			totalT: curr.T ? prev.totalT + 1 : prev.totalT,
			totalE_W_S: curr.E_W_S ? prev.totalE_W_S + 1 : prev.totalE_W_S,
			totalE_W_S_MAX: curr.E_W_S_MAX ? prev.totalE_W_S_MAX + 1 : prev.totalE_W_S_MAX,
			totalE_RF_DIF: curr.E_RF_DIF ? prev.totalE_RF_DIF + 1 : prev.totalE_RF_DIF,
			totalE_RF_I1: curr.E_RF_I1 ? prev.totalE_RF_I1 + 1 : prev.totalE_RF_I1,
			totalE_AH_ABS1: curr.E_AH_ABS1 ? prev.totalE_AH_ABS1 + 1 : prev.totalE_AH_ABS1,
			totalE_AP_ABS1: curr.E_AP_ABS1 ? prev.totalE_AP_ABS1 + 1 : prev.totalE_AP_ABS1,
			totalPANEL_TEMPERATURE: curr.PANEL_TEMPERATURE ? prev.totalPANEL_TEMPERATURE + 1 : prev.totalPANEL_TEMPERATURE,
			totalAMBIENT_TEMPERATURE: curr.AMBIENT_TEMPERATURE ? prev.totalAMBIENT_TEMPERATURE + 1 : prev.totalAMBIENT_TEMPERATURE,
		}
	}, {
		interval: null,
		time: null,
		SRAD: 0,
		E_AH_REL1: 0,
		E_AP_REL1: 0,
		E_W_D: 0,
		E_PRECIPITATION: 0,
		T: 0,
		E_W_S: 0,
		E_W_S_MAX: 0,
		E_RF_DIF: 0,
		E_RF_I1: 0,
		E_AH_ABS1: 0,
		E_AP_ABS1: 0,
		PANEL_TEMPERATURE: 0,
		AMBIENT_TEMPERATURE: 0,

		totalSRAD: 0,
		totalE_AH_REL1: 0,
		totalE_AP_REL1: 0,
		totalE_W_D: 0,
		totalE_PRECIPITATION: 0,
		totalT: 0,
		totalE_W_S: 0,
		totalE_W_S_MAX: 0,
		totalE_RF_DIF: 0,
		totalE_RF_I1: 0,
		totalE_AH_ABS1: 0,
		totalE_AP_ABS1: 0,
		totalPANEL_TEMPERATURE: 0,
		totalAMBIENT_TEMPERATURE: 0,
	} as Partial<MeteoData> & {
		time: string
		device_id: string
		interval: number
		totalSRAD: number
		totalE_AH_REL1: number
		totalE_AP_REL1: number
		totalE_W_D: number
		totalE_PRECIPITATION: number
		totalT: number
		totalE_W_S: number
		totalE_W_S_MAX: number
		totalE_RF_DIF: number
		totalE_RF_I1: number
		totalE_AH_ABS1: number
		totalE_AP_ABS1: number
		totalPANEL_TEMPERATURE: number
		totalAMBIENT_TEMPERATURE: number
	})


	const siteMeteoInsert =
		[
			totalSRAD > 0 ? SRAD / totalSRAD : null,
			totalE_AH_REL1 > 0 ? E_AH_REL1 / totalE_AH_REL1 : null,
			totalE_AP_REL1 > 0 ? E_AP_REL1 / totalE_AP_REL1 : null,
			totalE_W_D > 0 ? E_W_D / totalE_W_D : null,
			totalE_PRECIPITATION > 0 ? E_PRECIPITATION / totalE_PRECIPITATION : null,
			totalE_W_S > 0 ? E_W_S / totalE_W_S : null,
			totalE_W_S_MAX > 0 ? E_W_S_MAX / totalE_W_S_MAX : null,
			totalE_RF_DIF > 0 ? E_RF_DIF / totalE_RF_DIF : null,
			totalE_RF_I1 > 0 ? E_RF_I1 / totalE_RF_I1 : null,
			totalE_AH_ABS1 > 0 ? E_AH_ABS1 / totalE_AH_ABS1 : null,
			totalE_AP_ABS1 > 0 ? E_AP_ABS1 / totalE_AP_ABS1 : null,

			totalPANEL_TEMPERATURE > 0 ? PANEL_TEMPERATURE / totalPANEL_TEMPERATURE : null,
			totalAMBIENT_TEMPERATURE > 0 ? AMBIENT_TEMPERATURE / totalAMBIENT_TEMPERATURE : null,
			time || null,
			interval || null,
			site_id || null,
		]

	const totalSQLQuery = format(
		`INSERT INTO meteo_timeseries
		(
			SRAD,
			E_AH_REL1,
			E_AP_REL1,
			E_W_D,
			E_PRECIPITATION,
			E_W_S,
			E_W_S_MAX,
			E_RF_DIF,
			E_RF_I1,
			E_AH_ABS1,
			E_AP_ABS1,

			PANEL_TEMPERATURE,
			AMBIENT_TEMPERATURE,
			time,
	   interval,
			site_id
		) VALUES
		(%L)
		ON CONFLICT DO NOTHING
			`,
		siteMeteoInsert,
	)




	try {
		await batchCreateDeviceMeteo(site_id, meteoData)
		return await dbClient.query(totalSQLQuery)
	} catch (error) {
		console.error('batchCreateBLMeteoDataTimestamp', error)
	}
}


const batchCreateDeviceMeteo = async (site_id: string, meteoData: Partial<MeteoData & { time: string; interval: number; device_id: string; }>[]): Promise<QueryResult> => {
	const meteoToInsert = meteoData.map(
		({ E_AH_ABS1, E_AH_REL1, E_AP_ABS1, E_AP_REL1, E_PRECIPITATION, E_RF_DIF, E_RF_I1, E_W_D, E_W_S, E_W_S_MAX, SRAD, PANEL_TEMPERATURE, AMBIENT_TEMPERATURE, time, interval, device_id }) =>
			[
				SRAD || null,
				E_AH_REL1 || null,
				E_AP_REL1 || null,
				E_W_D || null,
				E_PRECIPITATION || null,
				E_W_S || null,
				E_W_S_MAX || null,
				E_RF_DIF || null,
				E_RF_I1 || null,
				E_AH_ABS1 || null,
				E_AP_ABS1 || null,
				PANEL_TEMPERATURE || null,
				AMBIENT_TEMPERATURE || null,
				time || null,
				interval || null,
				device_id || null,
				site_id || null
			],
	)
	const deviceQuery = format(
		`INSERT INTO device_meteo_timeseries
		(
			SRAD,
			E_AH_REL1,
			E_AP_REL1,
			E_W_D,
			E_PRECIPITATION,
			E_W_S,
			E_W_S_MAX,
			E_RF_DIF,
			E_RF_I1,
			E_AH_ABS1,
			E_AP_ABS1,
			PANEL_TEMPERATURE,
			AMBIENT_TEMPERATURE,
			time,
			interval,
			device_id,
			site_id
		) VALUES
		%L
			`,
		meteoToInsert,
	)
	return await dbClient.query(deviceQuery)


}



export const meteoDao = {
	getForSite,
	getAllDeviceMeteo,
	batchCreateBLMeteoDataTimestamp,
	batchCreateDeviceMeteo
}


export default {
	getForSite,
	getAllDeviceMeteo,
	batchCreateBLMeteoDataTimestamp,
	batchCreateDeviceMeteo
}
