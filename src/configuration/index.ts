import { dbClient } from '../db/pool'
import {abbConfig} from './abb'
import {SiteConfigurationType} from '@autonomy-power/types'
const create = async (type: SiteConfigurationType, organizationId: string): Promise<boolean> => {
	const qs = `
		INSERT INTO organization_configuration_type(type, organization_id)
		VALUES ($1, $2)
	`
	await dbClient.query(qs, [type, organizationId])
	return true
}

const getSiteTypes = async (organizationId: string): Promise<Array<SiteConfigurationType>> => {
	const qs = `
		SELECT type from organization_configuration_type
		WHERE organization_id=$1
	`
	const res = await dbClient.query(qs, [organizationId])
	return res.rows.map(t => t.type)
}

export const configurationDao = {
	create, getSiteTypes,
	abb: abbConfig
}
