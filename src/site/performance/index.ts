import { QueryResult } from 'pg'
import { dbClient } from '../../db/pool'
import { camelToSnake } from '../../utils/camelSnake'

export const serializePerformanceGuarantee = (rows: Array<any>): Array<SitePerformanceGuarantee> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			siteId: '',
			dailyGeneration: 0,
			dailyEarnings: 0
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

const getPerformanceGuarantee = async (siteId: string): Promise<SitePerformanceGuarantee> => {
	const qs = `
		SELECT * from site_performance_guarantee
		WHERE site_id = $1
	`
	const performanceQuery = await dbClient.query(qs, [siteId])

	return serializePerformanceGuarantee(performanceQuery.rows)[0]
}

const deleteSitePerformanceGuarantee = async (siteId: string): Promise<Array<SitePerformanceGuarantee>> => {
	const qs = `
		DELETE from site_performance_guarantee
		WHERE site_id = $1
	`
	const res = await dbClient.query(qs, [siteId])

	return serializePerformanceGuarantee(res.rows)
}

const createSitePerformanceGuarantee = async (performanceGuarantee: SitePerformanceGuarantee): Promise<QueryResult<SitePerformanceGuarantee>> => {
	const {siteId, dailyEarnings, dailyGeneration} = performanceGuarantee
	const values = [siteId, dailyGeneration, dailyEarnings]

	const qs = `
		INSERT INTO site_performance_guarantee (site_id, daily_generation, daily_earnings)
		VALUES ($1, $2, $3)
		ON CONFLICT (site_id)
		DO
		UPDATE SET daily_generation = EXCLUDED.daily_generation, daily_earnings = EXCLUDED.daily_earnings
	`

	return await dbClient.query(qs, values)
}

export default {
	getPerformanceGuarantee,
	createSitePerformanceGuarantee,
	deleteSitePerformanceGuarantee,
}
