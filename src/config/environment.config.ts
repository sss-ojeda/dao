import { EnvironmentVariables, ConfigKeys } from '../types/enums/environment.enum'
import dotenv from 'dotenv'

export class EnvironmentModule {
	private environment: Partial<EnvironmentVariables> = {}

	constructor() {
		dotenv.config()
		this.set()
	}

	public get(key: ConfigKeys): string {
		return this.environment[key] ?? ''
	}

	private set(): void {
		this.environment = process.env
	}
}

export const environmentModule = new EnvironmentModule()
