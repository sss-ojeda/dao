import { dbClient } from '../db'
import { camelToSnake } from '../utils/camelSnake'
import { searchQueryBuilder } from '../db/queryBuilder'
import { v4 as uuid } from 'uuid'
import siteDao, { serialize as serializeSite } from '../site'
import commentDao from './comment'

const columnNames = [
	'title',
	'description',
	'is_closed',
	'created_at',
	'visual_id',
	'siteId',
]

const serialize = (rows: Array<any>): Array<Ticket> => {
	const serialized = rows.map((row) => {
		const rowCopy = {
			title: '',
			description: '',
			isClosed: false,
			createdAt: '',
			id: '',
			visualId: '',
			status: '',
			siteId: '',
			alerts: [],
			site: serializeSite([])[0]
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

export const getInfo = async (ticketId: string): Promise<Ticket> => {
	const res = await dbClient.query('SELECT * FROM ticket WHERE id=$1', [ticketId])
	const ticket = serialize(res.rows)[0]
	await Promise.all([
		//(ticket.alerts = (await getAllAlertsByTicket(ticketId)) || []),
		(ticket.site = await siteDao.getInfo(ticket.siteId)),
	])

	return ticket
}

export const getAll = async (
	options: SearchOptions
): Promise<Array<Ticket>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'ticket',
		[...columnNames, 'title'],
		options
	)

	const queryStr = `
		SELECT
		t.id,
		t.title, t.description, t.is_closed, t.created_at, t.site_id, t.status, t.visual_id
		FROM
		ticket t
		${queryOptions}
	`

	const res = await dbClient.query(queryStr, values)
	const tickets = serialize(res.rows)
	await Promise.all(
		tickets.map(async (ticket) => {
			ticket.site = await siteDao.getInfo(ticket.siteId)
			//ticket.alerts = (await getAllAlertsByTicket(ticket.id)) || [];
		})
	)
	return tickets
}


export const getAllOpen = async (
	options: SearchOptions
): Promise<Array<Ticket>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'ticket',
		[...columnNames],
		options
	)

	const queryStr = `
		SELECT
		t.id,
		t.title, t.description, t.is_closed, t.created_at, t.site_id, t.status,  t.visual_idq
		FROM
		ticket t WHERE t.is_closed=false
		${queryOptions}
	`

	const res = await dbClient.query(queryStr, values)
	const tickets = serialize(res.rows)
	await Promise.all(
		tickets.map(async (ticket) => {
			ticket.site = await siteDao.getInfo(ticket.siteId)
		})
	)
	return tickets
}

export const ticketIdExists = async (ticketId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from ticket where  id=$1)',
		[ticketId]
	)
	return res.rows[0].exists
}

export const create = async (newTicket: Ticket): Promise<string> => {
	const {
		title,
		description,
		isClosed,
		createdAt,
		siteId,
		status,
		deviceId,
	} = newTicket
	const id = uuid()

	const siteTicketCount = await getCountBySite(siteId)
	const siteName = (await siteDao.getInfo(siteId)).name
	const visualId = siteName.substr(0, 2).toUpperCase() + '-' + siteTicketCount.toString()

	const query = `
	INSERT INTO ticket(id, title, description, is_closed, created_at, site_id, status, device_id, visual_id)
	 VALUES ($1, $2,$3,$4,$5, $6,$7, $8, $9) RETURNING id`
	const res = await dbClient.query(query, [
		id,
		title,
		description,
		isClosed,
		createdAt,
		siteId,
		status,
		deviceId,
		visualId
	])
	const ticketId = res.rows[0].id
	return ticketId
}

export const deleteOne = async (ticketId: string): Promise<boolean> => {
	await dbClient.query('DELETE FROM ticket where id=$1', [ticketId])
	return true
}

export const getAllByticket_tag = async (ticket_tagId: string): Promise<Ticket> => {
	const query = 'SELECT * FROM  ticket WHERE ticket_tag_id = $1'
	const res = await dbClient.query(query, [ticket_tagId])
	return serialize(res.rows)[0]
}

export const getAllBySite = async (siteId: string): Promise<Ticket[]> => {
	const query = `
		SELECT * FROM  ticket

		WHERE site_id = $1`

	const res = await dbClient.query(query, [siteId])
	return serialize(res.rows)
}

export const getAllBySiteAndDescription = async (
	siteId: string,
	description: string,
	deviceId: string
): Promise<Array<Ticket>> => {
	const query = `
		SELECT * FROM  ticket
		WHERE site_id = $1 AND description= $2 AND device_id=$3`

	const res = await dbClient.query(query, [siteId, description, deviceId])
	const tickets = serialize(res.rows)
	await Promise.all(
		tickets.map(async (ticket) => {
			// ticket.alerts = await getAllAlertsByTicket(ticket.id) || [],
			ticket.site = await siteDao.getInfo(ticket.siteId)
		})
	)
	return tickets
}

const getCount = async (_options: SearchOptions): Promise<number> => {
	// let {queryOptions, values}= searchQueryBuilder('ticket', [...columnNames], options)
	const qs = `
	SELECT COUNT(*) FROM ticket
	`
	// + queryOptions
	const res = await dbClient.query(qs)
	return res.rows[0].count
}

const getCountBySite = async (siteId, _options?: SearchOptions): Promise<number> => {
	// let {queryOptions, values}= searchQueryBuilder('ticket', [...columnNames], options)
	const qs = `
	SELECT COUNT(*) FROM ticket
	WHERE site_id = $1
	`
	// + queryOptions
	const res = await dbClient.query(qs, [siteId])
	return res.rows[0].count
}

const getSearchCount = async (searchTerm: string): Promise<number> => {
	const qs = `
	SELECT COUNT(*) FROM ticket r
		WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}

const search = async (searchTerm: string, options): Promise<Array<Ticket>> => {
	const { queryOptions, values } = searchQueryBuilder(
		'ticket',
		[...columnNames],
		options,
		1
	)

	const queryStr = `
	SELECT
	title,description,is_closed,created_at
		FROM
		WHERE LOWER(r.name) LIKE  LOWER($1)
	${queryOptions}`

	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(queryStr, [searchValue, ...values])
	return serialize(res.rows)
}

const addAlert = async (
	ticketId: string,
	alertId: string
): Promise<boolean> => {
	const queryStr = `INSERT INTO ticket_alert(ticket_id, alert_id)
	VALUES($1, $2)`
	await dbClient.query(queryStr, [ticketId, alertId])
	return true
}

const closeTicket = async (ticketId: string): Promise<boolean> => {
	const queryStr = `
		UPDATE ticket  SET is_closed = true WHERE id=$1
  `
	await dbClient.query(queryStr, [ticketId])
	return true
}

const openTicket = async (ticketId: string): Promise<boolean> => {
	const queryStr = `
		UPDATE ticket  SET is_closed = false WHERE id=$1
  `
	await dbClient.query(queryStr, [ticketId])
	return true
}

const updateStatus = async (ticketId: string, status: string): Promise<boolean> => {
	const queryStr = `
		UPDATE ticket  SET status = $1 WHERE id=$2
  `

	await dbClient.query(queryStr, [status, ticketId])
	return true
}

const getAllOpenedBySiteAndDescription = async (
	siteId: string,
	description: string,
	deviceId: string): Promise<Array<Ticket>> => {
	const query = `
		SELECT * FROM  ticket
		WHERE site_id = $1 AND description= $2 AND device_id=$3 AND is_closed=false`

	const res = await dbClient.query(query, [siteId, description, deviceId])
	const tickets = serialize(res.rows)
	await Promise.all(
		tickets.map(async (ticket) => {
			// ticket.alerts = await getAllAlertsByTicket(ticket.id) || [],
			ticket.site = await siteDao.getInfo(ticket.siteId)
		})
	)
	return tickets
}

const getAlertTicket = async (
	alertId:string
) => {
	const qs =`
	SELECT * from ticket INNER JOIN ticket_alert ta ON (alert_id=$1 and ticket.id=ta.ticket_id) `
	const res = await dbClient.query(qs, [alertId])
	return serialize(res.rows)[0]
}

export default {
	getAll,
	addAlert,
	deleteOne,
	create,
	getInfo,
	getCount,
	search,
	getSearchCount,
	ticketIdExists,
	getAllBySiteAndDescription,
	getAllOpenedBySiteAndDescription,
	updateStatus,
	closeTicket,
	openTicket,
	getAllBySite,
	getAlertTicket,
	comment: commentDao
}
