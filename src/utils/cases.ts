export const snakeToCamel = (str: string): string => str.replace(
	/([-_][a-z])/g,
	(group) => group.toUpperCase()
		.replace('-', '')
		.replace('_', '')
)

export const camelToSnake = (str: string): string => str.split(/(?=[A-Z])/).join('_').toLowerCase()
