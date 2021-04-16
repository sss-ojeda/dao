import { Pool, PoolClient } from 'pg'
import { environmentModule } from '../config/environment.config'
import { ConfigKeys } from '../types/enums/environment.enum'

const POSTGRES_HOST = environmentModule.get(ConfigKeys.postgresHost)
const POSTGRES_USER = environmentModule.get(ConfigKeys.postgresUser)
const POSTGRES_PASSWORD = environmentModule.get(ConfigKeys.postgresPassword)
const POSTGRES_DB = environmentModule.get(ConfigKeys.postgresDb)
const POSTGRES_PORT = environmentModule.get(ConfigKeys.postgresPort)

const connectionString = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`

const pool = new Pool({ connectionString })

let dbClient: PoolClient
pool.connect((error: Error, client: PoolClient) => {
	dbClient = client
})

pool.on('connect', () => {
	console.info('Connected to Database.')
})

pool.on('error', e => {
	console.error('Connection to Database Fails:')
	console.error(e)
})

const connectDb = (): Promise<void> => {
	return new Promise((res) => {
		pool.connect((error: Error, client: PoolClient) => {
			dbClient = client
			res()
		})
	})

}

export {
	dbClient,
	connectDb
}


export default pool
