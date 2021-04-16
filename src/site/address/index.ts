import { v4 as uuid } from 'uuid'

import { dbClient } from '../../db'
import { camelToSnake } from '../../utils/camelSnake'



const serialize = (rows: Array<any>): Array<Address> => {
	const serialized = rows.map(row => {
		const rowCopy = {
			id : '',
			name : '',
			state : '',
			administrativeArea : '',
			postcode : '',
			siteId : '',
			country : '',
			city : '',
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


export const getInfo = async (siteId: string): Promise<Address> => {
	const address = await dbClient.query('SELECT * FROM address WHERE site_id=$1', [siteId])
	return serialize(address.rows)[0]
}


export const create = async (address: Address): Promise<string> => {
	const {name, administrativeArea, postcode, country, city, siteId } = address
	const id = uuid()

	const query = `
		INSERT INTO address(id, name, administrative_area, postcode, country, city, site_id)
		VALUES ($1, $2,$3,$4,$5, $6, $7) RETURNING id
	`
	const res = await dbClient.query(query, [id, name, administrativeArea, postcode, country, city, siteId])
	const addressId = res.rows[0].id
	return addressId
}

export const modifyAddress = async (address: Address) : Promise<boolean> => {
	const {name, administrativeArea, postcode, country, city, siteId } = address
	const qs = `
		UPDATE address SET
		name = $1 ,
		administrative_area = $2 ,
		postcode = $3 ,
		country = $4 ,
		city = $5
		WHERE site_id='${siteId}'
	`

	await dbClient.query(qs, [name, administrativeArea, postcode, country, city])
	return true
}


export const siteHasAddress = async (siteId: string): Promise<boolean> => {
	const res = await dbClient.query(
		'select exists(select 1 from address where  site_id=$1)',
		[siteId]
	)

	return res.rows[0].exists
}



export const addressDao =  {
	create,
	getInfo,
	modifyAddress,
	siteHasAddress
}
