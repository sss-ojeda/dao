import { dbClient } from '../../db/pool'
import bluelogDao from './bluelog'
import solaredgeDao from './solaredge'
import abbDao from './abb'
import {SiteConfigurationType } from '@autonomy-power/types'
const create = async (type: SiteConfigurationType, siteId: string): Promise<boolean> => {
	const qs = `
		INSERT INTO site_configuration_type(type, site_id)
		VALUES ($1, $2)
	`
	await dbClient.query(qs, [type, siteId])
	return true
}

const getSiteTypes = async (siteId: string): Promise<Array<SiteConfigurationType>> => {
	const qs = `
		SELECT type from site_configuration_type
		WHERE site_id=$1
	`
	const res = await dbClient.query(qs, [siteId])
	return res.rows.map(t => t.type)
}

export default {
	create,
	getSiteTypes,
	abb: abbDao,
	solaredge: solaredgeDao,
	bluelog: bluelogDao
}
