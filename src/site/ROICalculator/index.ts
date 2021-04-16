import { dbClient } from '../../db/pool'
import {rateDao as rate} from './rate'
import {SiteFinancialTimeserie} from '@autonomy-power/types'
export const getSiteFinancialTimeseries = async(siteId, interval: 'hour'|'day'| 'month', startDate:string, endDate: string)
: Promise<Array<SiteFinancialTimeserie>> => {
	const table = interval === 'hour' ? 'site_financial_hour_timeseries' :
		interval=== 'day' ? 'site_financial_day_timeseries': 'site_financial_month_timeseries'
	const values = [siteId, startDate, endDate]
	const qs = `
		SELECT * from ${table}
		WHERE site_id=$1
		AND time BETWEEN $2 AND $3
		ORDER BY time
	`
	const res = await dbClient.query(qs, values)
	return res.rows
}

export default {
	getSiteFinancialTimeseries,
	rate
}
