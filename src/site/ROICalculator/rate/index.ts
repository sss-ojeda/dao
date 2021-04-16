
import { v4 as uuid } from 'uuid'
import { camelToSnake } from '../../../utils/camelSnake'
import { dbClient } from '../../../db/pool'
import {SiteRate, SiteExportRate, SiteFlatCharge} from '@autonomy-power/types'

export const serializeRate = (rows: Array<any>): Array<SiteRate> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'siteId': '',
			'price': 0,
			'endHour': '',
			'startHour': '',
			id: '',
			days: []
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

export const serializeFlatCharge = (rows: Array<any>): Array<SiteFlatCharge> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'siteId': '',
			'price': 0,
			'name': '',
			'category': '',
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
export const serializeExportRate = (rows: Array<any>): Array<SiteExportRate> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'siteId': '',
			'price': 0,
			'endHour': '',
			'startHour': '',
			id: '',
			days: []
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
export const getRates = async (siteId: string): Promise<Array<SiteRate>> => {
	const qs = `
		SELECT * from site_rate
		WHERE site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])

	const rates = await Promise.all(serializeRate(res.rows).map(async (rate)=>{
		const days = await getRateDays(rate.id)
		return {
			...rate,
			days
		}
	}))
	return rates
}

export const getRateDays = async (rateId: string): Promise<Array<number>> => {
	const qs = `
		SELECT day from site_rate_day
		WHERE rate_id = $1
	`
	const res = await dbClient.query(qs, [rateId])
	return res.rows.map((r)=> r.day)
}

export const deleteSiteRate = async (rateId: string): Promise<Array<SiteRate>> => {
	const qs = `
		DELETE from site_rate
		WHERE id = $1
	`
	const res = await dbClient.query(qs, [rateId])
	return serializeRate(res.rows)
}

export const createSiteRate = async (siteRate: SiteRate): Promise<boolean> => {
	const id = uuid()
	const { siteId, price, endHour, startHour } = siteRate
	const values = [id, siteId, price, endHour, startHour]
	const qs = `
    INSERT INTO site_rate (id, site_id, price, end_hour, start_hour)
    VALUES ($1, $2, $3, $4, $5)
    `
	await dbClient.query(qs, values)
	await createSiteRateDays(id, siteRate.days)
	return true
}

export const createSiteRateDays = async (rateId:string, days: Array<number>): Promise<boolean> => {

	await Promise.all(days.map(async day=>{
		const qs = `
	INSERT INTO site_rate_day  (rate_id, day)
	VALUES ($1, $2)
	`
		await dbClient.query(qs, [rateId, day])
	}))
	return true
}
export const getFlatCharges = async (siteId: string): Promise<Array<SiteFlatCharge>> => {
	const qs = `
		SELECT * from site_flat_charge
		WHERE site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])
	return serializeFlatCharge(res.rows)
}

export const deleteSiteFlatCharge = async (rateId: string): Promise<Array<SiteFlatCharge>> => {
	const qs = `
		DELETE from site_flat_charge
		WHERE id = $1
	`
	const res = await dbClient.query(qs, [rateId])
	return serializeFlatCharge(res.rows)
}

export const createSiteFlatCharge = async (siteFlatCharge: SiteFlatCharge): Promise<boolean> => {
	const { siteId, price, name, category } = siteFlatCharge
	const id = uuid()
	const values = [id, siteId, price, name, category]
	const qs = `
		INSERT INTO site_flat_charge (id, site_id, price, name, category)
		VALUES ($1, $2, $3, $4, $5)
	`
	await dbClient.query(qs, values)
	return true
}



export const getExportRates = async (siteId: string): Promise<Array<SiteExportRate>> => {
	const qs = `
		SELECT * from site_export_rate
		WHERE site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])

	const rates = await Promise.all(serializeExportRate(res.rows).map(async (rate)=>{
		const days = await getExportRateDays(rate.id)
		return {
			...rate,
			days
		}
	}))
	return rates
}

export const getExportRateDays = async (rateId: string): Promise<Array<number>> => {
	const qs = `
		SELECT day from site_export_rate_day
		WHERE export_rate_id = $1
	`
	const res = await dbClient.query(qs, [rateId])
	return res.rows.map((r)=> r.day)
}

export const deleteSiteExportRate = async (rateId: string): Promise<Array<SiteExportRate>> => {
	const qs = `
		DELETE from site_export_rate
		WHERE id = $1
	`
	const res = await dbClient.query(qs, [rateId])
	return serializeExportRate(res.rows)
}

export const createSiteExportRate = async (siteExportRate: SiteExportRate): Promise<boolean> => {
	const id = uuid()
	const { siteId, price, endHour, startHour } = siteExportRate
	const values = [id, siteId, price, endHour, startHour]
	const qs = `
    INSERT INTO site_export_rate (id, site_id, price, end_hour, start_hour)
    VALUES ($1, $2, $3, $4, $5)
    `
	await dbClient.query(qs, values)
	await createSiteExportRateDays(id, siteExportRate.days)
	return true
}

export const createSiteExportRateDays = async (rateId:string, days: Array<number>): Promise<boolean> => {

	await Promise.all(days.map(async day=>{
		const qs = `
	INSERT INTO site_export_rate_day  (export_rate_id, day)
	VALUES ($1, $2)
	`
		await dbClient.query(qs, [rateId, day])
	}))
	return true
}

export const rateDao = {
	getRates,
	createSiteRate,
	deleteSiteRate,
	getExportRates,
	createSiteExportRate,
	deleteSiteExportRate,
	deleteSiteFlatCharge,
	getFlatCharges,
	createSiteFlatCharge

}
