import { v4 as uuid } from 'uuid'
import { dbClient } from '../db'
// Write handler in case index is not found
import { searchQueryBuilder } from '../db/queryBuilder'
import { camelToSnake } from '../utils/camelSnake'
import {Organization, SearchOptions } from '@autonomy-power/types'
const columnNames = [
	'name',
	'isClient',
	'id'
]


export const serialize = (rows: Array<any>): Array<Organization> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			'name': '',
			'isClient': false,
			'id': '',
			configurations: []
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


export const create = async (newOrganization: Organization): Promise<Organization> => {
	const { name, isClient } = newOrganization
	const id = uuid()
	const query = `
	INSERT INTO organization(id, name, is_client)
	VALUES ($1, $2, $3)`
	await dbClient.query(query, [id, name, isClient])
	return { ...newOrganization, id }
}


const addParent = async (childId: string, parentId: string): Promise<boolean> => {
	const query = `
	INSERT INTO parent_child_organization(child_id, parent_id)
	VALUES ($1, $2)`
	await dbClient.query(query, [childId, parentId])
	return true
}


export const getAllForUser = async (userId: string, options: SearchOptions): Promise<Array<Organization>> => {
	const { queryOptions, values } = searchQueryBuilder('organization', [...columnNames], options)

	const queryStr = `
	SELECT
	s.id,
	s.name, s.description
	FROM
	organization s WHERE is_client=true
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)
	// Include restriction by owner id
	// Include relations here

	return serialize(res.rows)
}


const getAllManagingOrganizations = async (options: SearchOptions): Promise<Array<Organization>> => {
	const { queryOptions, values } = searchQueryBuilder('organization', [...columnNames], options)

	const queryStr = `
	SELECT
	o.id,
	o.name, o.is_client
	FROM
	organization o WHERE is_client=false
	${queryOptions}`

	const res = await dbClient.query(queryStr, values)
	// Include restriction by owner id
	// Include relations here

	return serialize(res.rows)
}


const getAllManagingOrganizationsCount = async (): Promise<number> => {
	const queryStr = `
	SELECT
	count(*)
	FROM
	organization WHERE is_client=false
	`

	const res = await dbClient.query(queryStr)
	// Include restriction by owner id
	// Include relations here

	return res.rows[0].count
}


const getAllClientOrganization = async (user: UserAccount, options: SearchOptions): Promise<Array<Organization>> => {
	const { queryOptions, values } = searchQueryBuilder('organization', [...columnNames], options, 1)
	const parentOrganizationId = user.organization.id
	const queryStr = `
	SELECT
	o.id,
	o.name, o.is_client
	FROM
    organization o
    INNER JOIN parent_child_organization pco
    ON (o.is_client=true AND pco.parent_id=$1 AND o.id=pco.child_id)
	${queryOptions}`
	const res = await dbClient.query(queryStr, [parentOrganizationId, ...values])

	return serialize(res.rows)
}


const getAllClientOrganizationCount = async (user: UserAccount): Promise<number> => {
	const parentOrganizationId = user.organization.id
	const queryStr = `
	SELECT
	COUNT(*)
	FROM
	organization o
	INNER JOIN parent_child_organization pco
	ON (o.is_client=true AND pco.parent_id=$1 AND o.id=pco.child_id)
	`

	const res = await dbClient.query(queryStr, [parentOrganizationId])
	return res.rows[0].count
}


const getInfo = async (id: string): Promise<Organization> => {
	const queryStr = `
  SELECT
	o.id,
	o.name, o.is_client
	FROM
  organization o WHERE id=$1
	`
	const res = await dbClient.query(queryStr, [id])
	const organization = serialize(res.rows)[0]
	return organization
}


export const organizationIdExists = async (id: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from organization where  id=$1)',
		[id])
	return res.rows[0].exists
}


export default {
	create,
	getAllManagingOrganizations,
	getAllManagingOrganizationsCount,
	getAllClientOrganization,
	getAllClientOrganizationCount,
	getInfo,
	serialize,
	organizationIdExists,
	addParent
}
