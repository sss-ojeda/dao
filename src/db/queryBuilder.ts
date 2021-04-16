export const searchQueryBuilder = (tableName: string, columnNames: Array<string>, options: SearchOptions, existingValues?: number): any => {
	const values = []
	let queryOptions = ''
	existingValues = existingValues || 0

	if (options.sort.length > 0) {
		queryOptions += 'ORDER BY '
		options.sort.forEach(rule => {
			const columnName = rule.val
			if (!columnName.includes(columnName))
				throw new Error(`${columnName} is not a column`)
			if (rule.order === 'ASC' || rule.order === 'DESC') {
				queryOptions += `${columnName} ${rule.order} `
			}
			queryOptions += ' NULLS LAST, '
		})
		queryOptions = queryOptions.substr(0, queryOptions.length - 2)
	}

	if (options.offset >= 0 && options.limit) {
		queryOptions += ` LIMIT $${values.length + 1 + existingValues}	OFFSET $${values.length + 2 + existingValues}`
		values.push(options.limit)
		values.push(options.offset * options.limit)
	}

	return { queryOptions, values }
}
export const queryBuilders = {
	searchQueryBuilder
}
