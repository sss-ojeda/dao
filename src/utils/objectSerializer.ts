import _ from 'lodash'

const isArray = (data: any) => _.isArray(data)
const isObject = (data: any) => _.isObject(data)

const toCamel = (text: string) => {
	return text.replace(/([-_][a-z])/ig, ($1) => {
		return $1.toUpperCase()
			.replace('-', '')
			.replace('_', '')
	})
}

const renameObjectKeys = (object: Record<string, any>) => Object
	.keys(object)
	.reduce((prev, key) => {
		return {
			...prev,
			[toCamel(key)]: objectKeysSnakeToCamelCase(object[key])
		}
	}, {})

export const objectKeysSnakeToCamelCase = (data: Record<string, any>): Record<string, any> => {
	if (isArray(data)) {
		return data.map((value: any) => {
			return objectKeysSnakeToCamelCase(value)
		})
	}

	if (isObject(data)) {
		return renameObjectKeys(data)
	}


	return data
}

