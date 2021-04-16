import { abbIntegrationDao } from './abb'
import {solaredgeDao} from './solaredge'
import{bluelogIntegrationDao} from './bluelog'

export const integrationDao = {
	abb: abbIntegrationDao,
	solaredge: solaredgeDao,
	bluelog: bluelogIntegrationDao
}
