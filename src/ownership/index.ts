import { v4 as uuid } from 'uuid'
import { dbClient } from '../db/pool'
import { searchQueryBuilder } from '../db/queryBuilder'
import { camelToSnake } from '../utils/camelSnake'

const columnNames = []

const serialize = (rows: Array<any>): Array<Ownership> => {
	const serialized = rows.map(row => {
		const rowCopy = {

			'id': ''
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

export const getInfo = async (ownershipId: string) => {
	const ownership = await dbClient.query('SELECT * FROM ownership WHERE id=$1', [ownershipId])
	return serialize(ownership.rows)[0]
}

export const getAll = async (options: SearchOptions): Promise<Array<Ownership>> => {
	const { queryOptions, values } = searchQueryBuilder('ownership', [...columnNames], options)

	const queryStr = `
	SELECT
	o.id,
	FROM
	ownership o
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)
	return serialize(res.rows)
}

export const ownershipIdExists = async (ownershipId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from ownership where  id=$1)',
		[ownershipId])
	return res.rows[0].exists
}

export const create = async (_newOwnership: Ownership): Promise<string> => {
	// const { } = newOwnership
	const id = uuid()

	const query = `
		INSERT INTO ownership(id)
		VALUES ($1) RETURNING id
	`
	const res = await dbClient.query(query, [id,])
	const ownershipId = res.rows[0].id
	return ownershipId
}

export const deleteOne = async (ownershipId): Promise<boolean> => {
	await dbClient.query('DELETE FROM ownership where id=$1', [ownershipId])
	return true
}

export const getAllByuserAccount = async (userAccountId) => {
	const query = 'SELECT * FROM  ownership WHERE user_account_id = $1'
	const res = await dbClient.query(query, [userAccountId])
	return serialize(res.rows)
}

const getCount = async (options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('ownership', [...columnNames], options)
	const qs = `
	SELECT COUNT(*) FROM ownership
	` + queryOptions
	const res = await dbClient.query(qs, values)
	return res.rows[0].count
}

const getSearchCount = async (searchTerm: string, _options): Promise<number> => {
	const qs = `
	SELECT COUNT(*) FROM ownership  r
	WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}

const search = async (searchTerm: string, options): Promise<Array<Ownership>> => {
	const { queryOptions, values } = searchQueryBuilder('ownership', [...columnNames], options, 1)

	const queryStr = `
		SELECT
		FROM
		WHERE LOWER(r.name) LIKE  LOWER($1)
		${queryOptions}
	`

	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(queryStr, [searchValue, ...values])

	return serialize(res.rows)
}

export default {
	getAll,
	deleteOne,
	create,
	getInfo,
	getCount,
	search,
	getSearchCount,
	ownershipIdExists
}
