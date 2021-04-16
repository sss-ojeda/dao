import { v4 as uuid } from 'uuid'
import { dbClient } from '../../../db/pool'
import { searchQueryBuilder } from '../../../db/queryBuilder'
import { camelToSnake } from '../../../utils/camelSnake'

const columnNames = [
	'name',
	'capacity',
	'number',
]

const serialize = (rows: Array<any>): Array<Inverter> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'name': '',
			'capacity': 0,
			'number': 0,
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

export const getInfo = async (inverterId: string) => {
	const inverter = await dbClient.query('SELECT * FROM device WHERE id=$1', [inverterId])
	return serialize(inverter.rows)[0]
}

export const getAll = async (options: SearchOptions): Promise<Array<Inverter>> => {
	const { queryOptions, values } = searchQueryBuilder('device', [...columnNames], options)

	const queryStr = `
	SELECT
	i.id,
	i.name, i.capacity, i.number
	FROM
	device i
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)

	return serialize(res.rows)
}

export const inverterIdExists = async (inverterId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from inverter where  id=$1)',
		[inverterId])
	return res.rows[0].exists
}

export const create = async (newInverter: Inverter): Promise<string> => {
	const { name, capacity, number } = newInverter
	const id = uuid()

	const query = `
	INSERT INTO inverter(id, name, capacity, number)
	 VALUES ($1, $2,$3,$4) RETURNING id`
	const res = await dbClient.query(query, [id, name, capacity, number])
	const inverterId = res.rows[0].id
	return inverterId
}

export const deleteOne = async (inverterId): Promise<boolean> => {
	await dbClient.query('DELETE FROM inverter where id=$1', [inverterId])
	return true
}

export const getAllBysite = async (siteId) => {
	const query = 'SELECT * FROM  inverter WHERE site_id = $1'
	const res = await dbClient.query(query, [siteId])
	return serialize(res.rows)[0]
}

const getCount = async (options: SearchOptions): Promise<number> => {
	const { queryOptions, values } = searchQueryBuilder('inverter', [...columnNames], options)
	const qs = `
	SELECT COUNT(*) FROM inverter
	` + queryOptions
	const res = await dbClient.query(qs, values)
	return res.rows[0].count
}

const getSearchCount = async (searchTerm: string, _options): Promise<number> => {
	const qs = `
	SELECT COUNT(*) FROM inverter  r
	WHERE LOWER(r.name) LIKE  LOWER($1)
	`
	const searchValue = '%' + searchTerm + '%'
	const res = await dbClient.query(qs, [searchValue])
	return res.rows[0].count
}

const search = async (searchTerm: string, options): Promise<Array<Inverter>> => {
	const { queryOptions, values } = searchQueryBuilder('inverter', [...columnNames], options, 1)

	const queryStr = `
	SELECT
	name,capacity,number
		FROM
		WHERE LOWER(r.name) LIKE  LOWER($1)
	${queryOptions}`

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
	inverterIdExists
}
