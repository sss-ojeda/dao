import { dbClient } from '../../db'

 
export const getMonthlyTimeseries  = async(organizationId): Promise<any> => {
	const qs = `
        SELECT * from portfolio_financial_month_timeseries
        WHERE organization_id=$1
    `
	const res = await dbClient.query(qs, [organizationId])
	const rows = res.rows
	return rows

}




export const portfolioDao = {
	getMonthlyTimeseries
}