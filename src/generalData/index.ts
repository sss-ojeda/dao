import { dbClient } from '../db'
import {InverterData,InverterDataTimeseries} from '@autonomy-power/types'

export const updateSiteGeneralDataWithInverters = async (siteId: string, start: string, end: string): Promise<boolean> => {
	const qs = `
	INSERT INTO site_general_data_timeseries
	(
	P_AC, P_DC, E_TOTAL, E_DAY, U_DC1, I_DC1, U_DC2, I_DC2, U_DC3,
	I_DC3, U_DC4, I_DC4, U_AC_L1L2, U_AC_L2L3, U_AC_L3L1, I_AC1,
	I_AC2, I_AC3, F_AC, Q_AC, S_AC, COS_PHI, R_ISO, U_DC, I_DC,
	I_DC2_1, I_DC3_1, I_DC4_1, time, interval, site_id)
	(SELECT
		SUM(P_AC), SUM(P_DC), SUM(E_TOTAL), SUM(E_DAY), AVG(U_DC1), SUM(I_DC1), AVG(U_DC2), SUM(I_DC2), AVG(U_DC3),
		SUM(I_DC3), AVG(U_DC4), SUM(I_DC4), AVG(U_AC_L1L2), AVG(U_AC_L2L3), AVG(U_AC_L3L1), SUM(I_AC1),
		SUM(I_AC2), SUM(I_AC3), AVG(F_AC), AVG(Q_AC), AVG(S_AC), AVG(COS_PHI), AVG(R_ISO), AVG(U_DC), SUM(I_DC),
		SUM(I_DC2_1), SUM(I_DC3_1), SUM(I_DC4_1),
		g.time, g.interval, d.site_id
		FROM inverter_general_data_timeseries g
		INNER JOIN device d
		ON g.device_id=d.id
		AND time BETWEEN  $2 AND $3
		AND site_id = $1

		GROUP BY time, g.interval, d.site_id
		ORDER BY time
	)
	ON CONFLICT DO NOTHING
	`

	const values = [siteId, start, end]
	await dbClient.query(qs, values)
	return true
}


import targetInverterFields from './targetInverterFields'

export const batchCreateBLInverterDataTimeseries = async (inverterData: Array<InverterDataTimeseries>) => {
	const values = getFullInverterDataValues(inverterData)

	const qsNumberOfFields = targetInverterFields.map((field, i) => '$' + (i + 1) + '::float[]').join(', ') +
		`, $${targetInverterFields.length + 1}::timestamp[], $${targetInverterFields.length + 2}::integer[],
	$${targetInverterFields.length + 3}::text[]`
	const qsFields = targetInverterFields.join(', ') + ', time, interval, device_id '
	const qs = `
    INSERT INTO inverter_general_data_timeseries
    (${qsFields})
    SELECT * FROM UNNEST (${qsNumberOfFields})
	`
	await dbClient.query(qs, values)
	return true
}

export const getFullInverterDataValues = (inverterData: Array<InverterDataTimeseries>): Array<Array<number | string>> => {
	const allValues = []
	// new Array(targetInverterFields.length + 2).fill([])
	const fullInverterTimestampArr = [...targetInverterFields, 'time', 'interval', 'deviceId']
	for (let i = 0; i < fullInverterTimestampArr.length; i++) {
		const f = fullInverterTimestampArr[i]
		allValues.push([])
		// fullInverterTimestampArr.forEach((f)=> {
		for (let inverterDataIndex = 0; inverterDataIndex < inverterData.length; inverterDataIndex++) {
			// inverterData.forEach((data, inverterDataIndex)=> {
			const data = JSON.parse(JSON.stringify(inverterData[inverterDataIndex]))[f] || null
			const targetFieldIndex = fullInverterTimestampArr.indexOf(f)
			// numberOfInterval += 1
			// allValues[intervalIndex][inverterDataIndex] = data

			allValues[targetFieldIndex][inverterDataIndex] = data
			// })
		}
	}

	// })
	return allValues
}


const batchCreateBLInverterDataTimestamp = async (inverterData: Array<InverterDataTimeseries>) => {
	const values = getFullInverterDataValues(inverterData)

	const qsNumberOfFields = targetInverterFields.map((field, i) => '$' + (i + 1) + '::float[]').join(', ') +
		`, $${targetInverterFields.length + 1}::timestamp[], $${targetInverterFields.length + 2}::integer[],
	$${targetInverterFields.length + 3}::text[]`
	const qsFields = targetInverterFields.join(', ') + ', time, interval, device_id '
	const qs = `
    INSERT INTO inverter_general_data_timeseries
    (${qsFields})
    SELECT * FROM UNNEST (${qsNumberOfFields})
	`
	await dbClient.query(qs, values)
	return true
}


export const compartiment = (arr: Array<InverterData>) => {
	const final = new Array(arr.length).fill([])
	const availableFields = Object.keys(arr)
	availableFields.forEach((field, i) => {
		final[i].push(field)
	})
	return final
}



export const generalDataDao =  {
	updateSiteGeneralDataWithInverters,
	batchCreateBLInverterDataTimeseries,
	getFullInverterDataValues,
	batchCreateBLInverterDataTimestamp
}
