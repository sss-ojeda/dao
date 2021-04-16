
import { dbClient } from '../db'
import { searchQueryBuilder } from '../db/queryBuilder'
import {SearchOptions} from '@autonomy-power/types'
const columnNames = ['user_account_id', 'site_id']

export const getMemberSites = async (userAccountId: string,  options: SearchOptions) : Promise<Array<string>> => {
	const { queryOptions, values } = searchQueryBuilder('member_sites', [...columnNames], options, 1)
	const qs = `
	SELECT * from member_sites WHERE user_account_id=$1
	${queryOptions}`

	const res = await dbClient.query(qs, [userAccountId, ...values])

	const siteIds = res.rows.map((row)=> row.site_id)
	return siteIds
}

export const getMemberSitesCount = async (userAccountId: string): Promise<Array<string>> => {
	const qs = 'SELECT count(*) from member_sites WHERE user_account_id=$1'

	const res = await dbClient.query(qs, [userAccountId])

	return res.rows[0].count
}

export const getSiteMembers = async (siteId: string, options: SearchOptions): Promise<Array<string>> => {
	const { queryOptions, values } = searchQueryBuilder('member_sites', [...columnNames], options, 1)

	const qs = `
	SELECT * from member_sites WHERE site_id=$1
	${queryOptions}`
	const res = await dbClient.query(qs, [siteId, ...values])
	const siteIds = res.rows.map((row)=> row.user_account_id)
	return siteIds
}


export const getSiteMembersCount = async (siteId: string): Promise<Array<string>> => {
	const qs = 'SELECT count(*) from member_sites WHERE site_id=$1'
	const res = await dbClient.query(qs, [siteId])
	return res.rows[0].count
}


export const addMemberToSite = async ( siteId: string, userAccountId: string) : Promise<boolean> => {
	const qs = 'INSERT INTO member_sites (site_id, user_account_id) VALUES($1, $2)'
	await dbClient.query(qs, [siteId, userAccountId])
	return true
}


export const accessDao = {
	getMemberSites,
	addMemberToSite,
	getSiteMembers
}
