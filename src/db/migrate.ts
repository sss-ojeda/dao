import { dbClient } from './pool'
import fs from 'fs'
import path from 'path'

export const migrate = async () => {
	try {
		const queryStr = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'models.psql'))
		await dbClient.query(queryStr.toString())
	} catch (e) {
		console.error(e)
	}
}
