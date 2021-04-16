
import { v4 as uuid } from 'uuid'
import { dbClient } from '../db'
import { serialize as serializeSite } from '../site'
import { camelToSnake } from '../utils/camelSnake'
import inverterDao from './inverter'
const serializeSiteNotificationGroup = (rows: Array<any>): Array<SiteNotificationGroup> => {
	const serialized = rows.map(row => {
		const rowCopy: SiteNotificationGroup = {
			'name': '',
			notifications: [],
			siteId: '',
			emails: [],
			'id': '',
		}
		for (const key in rowCopy) {
			if (Object.hasOwnProperty.call(row, camelToSnake(key))) {
				rowCopy[key] = row[camelToSnake(key)]
			}
			if (key === 'site') {
				const site = serializeSite(row.site)[0]
				rowCopy.site = site
			}
		}
		return rowCopy
	})
	return serialized
}


const createSiteNotificationGroup = async (siteNotificationGroup: SiteNotificationGroup):
	Promise<string> => {
	const { siteId, name, emails } = siteNotificationGroup
	const id = uuid()
	const values = [id, siteId, name]
	const qs = `
        INSERT INTO site_notification_group (id, site_id, name)
        VALUES($1, $2, $3)
    `

	await dbClient.query(qs, values)
	await addSiteGroupUser(id, emails)
	return id
}

const deleteSiteNotificationGroup = async (siteNotificationGroupId: string):
	Promise<boolean> => {
	const values = [siteNotificationGroupId]
	const qs = `
        DELETE FROM  site_notification_group WHERE id=$1
        `

	await dbClient.query(qs, values)
	return true
}


const addSiteGroupUser = async (siteGroupId: string, emails: Array<string>): Promise<boolean> => {
	await Promise.all(
		emails.map(async email => {
			const values = [email, siteGroupId]
			const qs = `
			INSERT INTO site_notification_group_email
			(email, site_notification_group_id)
			VALUES ($1, $2)
			`
			await dbClient.query(qs, values)
		}))
	return true
}


const getAllNotificationGroupIdsByOrganization = async (organizationId: string)
	: Promise<Array<SiteNotificationGroup>> => {
	const qs = `
	SELECT
	s.id as site_id,
	s.name as site_name,
	s.description as site_description,
	s.timezone as site_timezone,
	sng.id as id,
	sng.name
	FROM site_notification_group sng
	JOIN  site s ON sng.site_id=s.id
	JOIN site_organization so
	ON (
		so.organization_id=$1
		AND sng.site_id=so.site_id
	)
	`

	const values = [organizationId]
	const res = await dbClient.query(qs, values)
	const siteNotificationsGroup = serializeSiteNotificationGroup(res.rows)
	return siteNotificationsGroup
}


const getCountNotificationGroupIdsByOrganization = async (organizationId: string)
	: Promise<number> => {
	const qs = `
	SELECT
	COUNT(*)
	FROM site_notification_group sng
	JOIN  site s ON sng.site_id=s.id
	JOIN site_organization so
	ON (
		so.organization_id=$1
		AND sng.site_id=so.site_id
	)
	`

	const values = [organizationId]
	const res = await dbClient.query(qs, values)
	return res.rows[0].count
}


export default {
	createSiteNotificationGroup,
	deleteSiteNotificationGroup,
	getAllNotificationGroupIdsByOrganization,
	getCountNotificationGroupIdsByOrganization,
	inverter: inverterDao
}
