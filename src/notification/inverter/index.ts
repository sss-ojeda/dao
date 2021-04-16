
import { dbClient } from '../../db/pool'
import { v4 as uuid } from 'uuid'
import inverterDao from '../../device/inverter'

const createAllInvertersSiteNotificationThreshold =
	async (siteNotificationGroup: SiteNotificationGroup,
		notificationRules: ThresholdInverterNotificationRules):
		Promise<boolean> => {
		const siteId = siteNotificationGroup.siteId
		const allInverters = await inverterDao.getAllBySite(siteId)
		await Promise.all(
			allInverters.map(async (inverter) => {
				const { id } = inverter
				// const values = [id, siteId, name]
				const inverterNotification: ThresholdInverterNotification = {
					name: siteNotificationGroup.name,
					deviceId: id,
					siteNotificationGroupId: siteNotificationGroup.id,
					category: 'threshold',
					unit: 'G_AC',
					status: 'on',
					rules: {
						...notificationRules
					}
				}
				await createInverterNotificationThreshold(inverterNotification)
			})
		)

		return
	}
const createAllInvertersSiteNotificationRelativeDifference =
	async (
		siteNotificationGroup: SiteNotificationGroup,
		notificationRules: RelativeDifferenceInverterNotificationRules):
		Promise<boolean> => {
		const siteId = siteNotificationGroup.siteId
		const allInverters = await inverterDao.getAllBySite(siteId)
		await Promise.all(
			allInverters.map(async (inverter) => {
				const { id } = inverter
				// const values = [id, siteId, name]
				const inverterNotification: RelativeDifferenceInverterNotification = {
					name: siteNotificationGroup.name,
					deviceId: id,
					siteNotificationGroupId: siteNotificationGroup.id,
					category: 'relative-difference',
					unit: 'G_AC',
					status: 'on',
					rules: {
						...notificationRules
					}
				}
				await createInvertersSiteNotificationRelativeDifference(inverterNotification)
			})
		)

		return
	}

const createInverterNotificationWithoutRule = async (notification: InverterNotification):
	Promise<string> => {
	const id = uuid()
	const values = [
		id,
		notification.name,
		notification.deviceId,
		notification.siteNotificationGroupId,
		notification.category,
		notification.unit,
		'on']
	const qs = `
    	INSERT INTO inverter_notification (
        id,
        name,
        device_id,
        site_notification_group_id,
        category,
		unit,
		status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
	await dbClient.query(qs, values)


	return id
}
const createInverterNotificationThreshold = async (notification: ThresholdInverterNotification):
	Promise<string> => {
	const notificationId = await createInverterNotificationWithoutRule(notification)
	const values = [
		notificationId,
		notification.rules.value,
		notification.rules.duration
	]
	const qs = `
    INSERT INTO inverter_notification_threshold_rules (
        inverter_notification_id,
        duration,
        value
    )
    VALUES ($1, $2, $3)
    `
	await dbClient.query(qs, values)

	return notificationId
}

const createInvertersSiteNotificationRelativeDifference = async (notification: RelativeDifferenceInverterNotification):
	Promise<string> => {
	const notificationId = await createInverterNotificationWithoutRule(notification)
	const values = [
		notificationId,
		notification.rules.duration,
		notification.rules.percentage
	]
	const qs = `
    INSERT INTO inverter_notification_relative_difference_rules (
        inverter_notification_id,
        duration,
        percentage
    )
    VALUES ($1, $2, $3)
    `
	await dbClient.query(qs, values)

	return notificationId
}

export default {
	createAllInvertersSiteNotificationThreshold,
	createAllInvertersSiteNotificationRelativeDifference
}
