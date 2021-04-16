export const getSortOptions = (query: any): SortOptions[] => {
	try {
		const sortArray = JSON.parse(query.sort)
		const sorts = sortArray.map(sort => {
			const order = sort[0] === '-' ? 'ASC' : 'DESC'
			const val = sort.substr(1)
			return { order, val }
		})
		return sorts
	} catch (e) {
		return query.sort ? [{ val: query.sort.toString(), order: query.order == 'ASC' ? 'ASC' : 'DESC' }] : []
	}
}
