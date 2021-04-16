import {Site, SiteConfiguration, Organization} from '@autonomy-power/types'
import { v4 as uuid } from 'uuid'
import { getAllBySite as getAllTicketsBySite } from '../ticket'
import configurationDao from './configuration'
import { dbClient } from '../db'
import { searchQueryBuilder } from '../db/queryBuilder'
import { serialize as organizationSerialize } from '../organization'
import { camelToSnake } from '../utils/camelSnake'
import {accessDao} from './access'


const columnNames = [
	'name',
	'description'
]

export const serialize = (rows: Array<any>): Array<Site> => {
	const serialized = rows.map(row => {
		const rowCopy: Site = {
			'name': '',
			'description': '',
			'id': '',
			'timezone': '',
			'configurations': [],
			organizationId: '',
			isConsumer: false
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


const getBaseSiteConfigurations = async (siteId: string): Promise<Array<SiteConfiguration>> => {
	const types = await configurationDao.getSiteTypes(siteId)
	const configurationTypes = types.map(type => ({ type }))
	return configurationTypes
}

export const getInfo = async (siteId: string): Promise<Site> => {
	const res = await dbClient.query('SELECT * FROM site WHERE id=$1', [siteId])
	const site = serialize(res.rows)[0]
	site.tickets = await getAllTicketsBySite(siteId)
	site.configurations = await getBaseSiteConfigurations(siteId)
	return site
}

export const getInfoByName = async (name: string): Promise<Site> => {
	const res = await dbClient.query('SELECT * FROM site WHERE name=$1', [name])
	const site = serialize(res.rows)[0]
	site.tickets = await getAllTicketsBySite(name)
	site.configurations = await getBaseSiteConfigurations(site.id)
	return site
}

export const getAll = async (options: SearchOptions): Promise<Array<Site>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options)

	const queryStr = `
	SELECT
	s.id,
	s.name, s.description
	FROM
	site s
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)
	const sites = serialize(res.rows)
	return sites
}

const getAllForClientOrg = async (organizationId: string, options: SearchOptions): Promise<Array<Site>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)

	const queryStr = `
	SELECT
	s.id,
	s.name, s.description,
	s.organization_id
	FROM
	site s
	WHERE organization_id=$1
	${queryOptions}`

	const res = await dbClient.query(queryStr, [organizationId, ...values])

	return serialize(res.rows)
}


const getCountClientOrg = async (organizationId: string, options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)
	const qs = `
	SELECT COUNT(*) FROM site  WHERE organization_id=$1
	` + queryOptions
	const res = await dbClient.query(qs, [organizationId, ...values])
	return res.rows[0].count
}

const getAllForOrganization = async (organizationId: string, options: SearchOptions): Promise<Array<Site>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)

	const qs = `
	SELECT
	s.id,
	s.name, s.description, s.organization_id
	FROM site s
	JOIN site_organization so
	ON (so.organization_id=$1 AND s.id=so.site_id)
	${queryOptions}
	`
	const res = await dbClient.query(qs, [organizationId, ...values])
	const sites = serialize(res.rows)
	return sites
}

const getAllCountForOrganization = async (organizationId: string, options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)
	const qs = `
	SELECT COUNT(*)
	FROM site s
	INNER JOIN site_organization so
	ON (so.organization_id=$1)
	${queryOptions}
	`
	const res = await dbClient.query(qs, [organizationId, ...values])
	return res.rows[0].count
}

export const getAllForManagingOrg = async (organizationId: string, options: SearchOptions): Promise<Array<Site>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)

	const queryStr = `
	SELECT
	s.id,
	s.name, s.description, s.organization_id
	FROM
	site s
	LEFT JOIN parent_child_organization pco ON (
		pco.parent_id=$1 AND s.organization_id=pco.child_id
	)
	${queryOptions}`

	const res = await dbClient.query(queryStr, [organizationId, ...values])

	return serialize(res.rows)
}

const getFinancialInfo = async (siteId: string): Promise<SiteFinancialInfo> => {
	const qs = `
		SELECT
		installation_date,
		price
		from site_financial_info
		WHERE site_id=$1
	`
	const res = await dbClient.query(qs, [siteId])
	const row = res.rows[0]
	if (!row) {
		return {
			price: 0,
			installationDate: new Date(),
			siteId
		}
	}

	return {
		price: row.price,
		installationDate: row.installation_date,
		siteId
	}
}


const addFinancialInfo = async (financialInfo: SiteFinancialInfo): Promise<boolean> => {
	const { siteId, installationDate, price } = financialInfo
	const values = [installationDate, price, siteId]
	const qs = `
		INSERT INTO  site_financial_info (
		installation_date,
		price, site_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (site_id) DO UPDATE
		SET installation_date=$1, price = $2
	`
	await dbClient.query(qs, values)

	return true
}
const getCountManagingOrg = async (organizationId: string, options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)
	const qs = `
	SELECT COUNT(*) FROM site s
	LEFT JOIN parent_child_organization pco ON (
		pco.parent_id=$1 AND s.organization_id=pco.child_id
	)
	` + queryOptions
	const res = await dbClient.query(qs, [organizationId, ...values])
	return res.rows[0].count
}

const addOrganization = async (siteId: string, organizationId: string): Promise<boolean> => {
	const qs = `
	INSERT INTO site_organization
	(site_id, organization_id)
	VALUES ($1, $2)`
	await dbClient.query(qs, [siteId, organizationId])
	return true
}

export const siteIdExists = async (siteId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from site where  id=$1)',
		[siteId])
	return res.rows[0].exists
}

export const siteNameExists = async (name: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from site where  name=$1)',
		[name])
	return res.rows[0].exists
}


export const create = async (newSite: Site): Promise<string> => {
	const { name, description, organizationId } = newSite
	const id = uuid()
	const query = `
	INSERT INTO
	site(id, name, description, organization_id)
	VALUES ($1, $2,$3, $4) RETURNING id`
	const res = await dbClient.query(query, [id, name, description, organizationId])
	const siteId = res.rows[0].id
	return siteId
}


export const deleteOne = async (siteId: string): Promise<boolean> => {
	await dbClient.query('DELETE FROM site where id=$1', [siteId])
	return true
}


export const getAllByticket = async (ticketId: string): Promise<Site[]> => {
	const query = `
		SELECT * FROM  site
		INNER JOIN ticket_site
		ON ( ticket_site.ticket_id = site.id)
		WHERE ticket_id = $1`
	const res = await dbClient.query(query, [ticketId])
	return serialize(res.rows)
}


const getCount = async (options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options)
	const qs = `
	SELECT COUNT(*) FROM site
	` + queryOptions
	const res = await dbClient.query(qs, values)
	return res.rows[0].count
}


const getSearchCount = async (searchTerm: string, _options): Promise<number> => {
	const qs = `
	SELECT COUNT(*) FROM site  r
	WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}


const search = async (searchTerm: string, options): Promise<Array<Site>> => {
	const { queryOptions, values } = searchQueryBuilder('site', [...columnNames], options, 1)

	const queryStr = `
	SELECT
	name,description
		FROM
		WHERE LOWER(r.name) LIKE  LOWER($1)
	${queryOptions}`

	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(queryStr, [searchValue, ...values])
	return serialize(res.rows)
}

const serializeTickets = (rows: Array<any>): Array<Ticket> => {
	const serialized = rows.map((row) => {
		const rowCopy = {
			title: '',
			description: '',
			isClosed: false,
			createdAt: '',
			id: '',
			status: '',
			siteId: '',
			alerts: []
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


export const getTickets = async (
	siteId: string,
	options: SearchOptions
): Promise<Array<Ticket>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'ticket',
		[...columnNames],
		options, 1
	)

	const queryStr = `
	  SELECT
	  t.id,
	  t.title, t.description, t.is_closed, t.created_at, t.site_id, t.status
	  FROM
	  ticket t
	  WHERE site_id=$1
	  ${queryOptions}`

	const res = await dbClient.query(queryStr, [siteId, ...values])
	const tickets = serializeTickets(res.rows)
	await Promise.all(
		tickets.map(async (ticket) => {
			ticket.site = await getInfo(ticket.siteId)
		})
	)

	return tickets
}

const getTicketsCount = async (siteId: string, _options: SearchOptions): Promise<number> => {
	const qs = `
	  SELECT COUNT(*) FROM ticket WHERE site_id=$1
	  `
	const res = await dbClient.query(qs, [siteId])
	return res.rows[0].count
}

const getOrganizations = async (siteId: string): Promise<Array<Organization>> => {
	const qs = `
		SELECT * from organization o
		 JOIN site_organization so
		ON (so.organization_id=o.id AND so.site_id =$1 )
	`
	const res = await dbClient.query(qs, [siteId])
	const organizations = organizationSerialize(res.rows)
	return organizations
}

const getMeteo = async (siteId: string, start: string, end: string): Promise<any[]> => {
	const query = `
		SELECT time, srad FROM meteo_timeseries
		WHERE site_id=$1
		AND time between $2 and $3
		ORDER BY time
	`

	const meteodata = await dbClient.query(query, [siteId, start, end])
	return meteodata.rows
}

export const getGeneralData = async (siteId: string, start: string, end: string, interval: string): Promise<any[]> => {
	const values = [start, end, siteId]

	const targetTable = interval === 'day' ? 'site_general_data_day_timeseries' :
		interval === 'hour' ? 'site_general_data_hour_timeseries' :
			interval === 'minute' ? 'site_general_data_timeseries' : ''
	const qs = `
	SELECT
		*
		FROM ${targetTable}

		WHERE
		("time" BETWEEN $1 AND $2)
		AND
		site_id=$3
		ORDER BY time ASC
	`
	const res = await dbClient.query(qs, values)
	return res.rows
}

export default {
	getAll,
	deleteOne,
	create,
	getGeneralData,
	getOrganizations,
	getInfo,
	getCount,
	getAllForOrganization,
	getAllCountForOrganization,
	search,
	getSearchCount,
	siteIdExists,
	getTickets,
	getTicketsCount,
	getInfoByName,
	getAllForClientOrg,
	getCountClientOrg,
	getAllForManagingOrg,
	getCountManagingOrg,
	addOrganization,
	getFinancialInfo,
	addFinancialInfo,
	getMeteo,
	configuration: configurationDao,
	access: accessDao
}
