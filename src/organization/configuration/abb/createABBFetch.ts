import axios, { AxiosInstance } from 'axios'

const getABBAuthedAxios = async (ABBConfig: ABBGlobalConf): Promise<AxiosInstance> => {

	const { email, password, apiKey } = ABBConfig
	const buff = new Buffer(email + ':' + password)
	const base64data = buff.toString('base64')
	// const bearerToken =
	const res = await axios.get('https://api.auroravision.net/api/rest/authenticate',
		{
			headers: {
				Authorization: 'Basic' + ' ' + base64data,
				'X-AuroraVision-ApiKey': apiKey
			}
		})
	const auroraToken = res.data.result


	return axios.create({
		headers: {
			Authorization: 'Basic' + ' ' + base64data,
			'X-AuroraVision-ApiKey': apiKey,
			'X-AuroraVision-Token': auroraToken
		}
	})
}

export default getABBAuthedAxios
