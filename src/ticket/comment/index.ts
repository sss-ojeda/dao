import {TicketComment} from '@autonomy-power/types'
import {v4 as uuid} from 'uuid'
import { dbClient } from '../../db/pool'
import { searchQueryBuilder } from '../../db/queryBuilder'
import userDao, { serialize as serializeUser } from '../../userAccount'
import { camelToSnake } from '../../utils/camelSnake'

const columnNames = [
	'content',
	'created_at',
	'creator_id',
	'ticket_id'
]

export const serialize = (rows: Array<any>): Array<TicketComment> => {
	const serialized = rows.map(row => {
		const rowCopy: TicketComment = {
			'content': '',
			'createdAt': '',
			'creatorId': '',
			'ticketId': '',
			'creator': serializeUser([])[0]
		}
		for (const key in rowCopy) {
			const snakeKey = camelToSnake(key)
			if (Object.hasOwnProperty.call(row, snakeKey)) {
				rowCopy[key] = row[camelToSnake(key)] || rowCopy[key]
			}
		}
		return rowCopy
	})
	return serialized
}

export const getInfo = async (commentId: string) => {
	const res = await dbClient.query('SELECT * FROM ticket_comment WHERE id=$1', [commentId])
	const comment = serialize(res.rows)[0]
	await Promise.all([
		comment.creator = await userDao.getInfo(comment.creatorId)
	])
	return comment
}

const getAllByTicket = async (ticketId: string, options: SearchOptions) => {
	const { queryOptions, values } = searchQueryBuilder('ticket_comment', [...columnNames], options, 1)
	const queryStr = `
	SELECT ${columnNames.join(',')} FROM ticket_comment WHERE ticket_id=$1
	${queryOptions}`
	const res = await dbClient.query(queryStr, [ticketId, ...values])
	const comments = serialize(res.rows)
	await Promise.all(comments.map(async (comment) => {
		comment.creator = await userDao.getInfo(comment.creatorId)
	})
	)
	return comments
}

const getCountByTicket = async (ticketId: string): Promise<number> => {
	const queryStr = `
	SELECT COUNT(*) FROM ticket_comment WHERE ticket_id=$1
	`
	const res = await dbClient.query(queryStr, [ticketId])
	return (res.rows as any)?.count
}

export const commentIdExists = async (commentId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from comment where  id=$1)',
		[commentId])
	return res.rows[0].exists
}

export const getCount = async (commentId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select COUNT(*) from comment where  id=$1)',
		[commentId])
	return res.rows[0].count
}

export const create = async (newTicketComment: TicketComment): Promise<string> => {
	const { content, createdAt, ticketId, creatorId } = newTicketComment
	const id = uuid()
	const query = `
	INSERT INTO ticket_comment
	(content, created_at, ticket_id, creator_id, id)
	VALUES ($1,$2, $3, $4, $5)
	RETURNING id`
	const res = await dbClient.query(query, [content, createdAt, ticketId, creatorId, id])
	const commentId = res.rows[0].id
	return commentId
}

export default {
	create,
	getInfo,
	getAllByTicket,
	commentIdExists,
	getCountByTicket
}
