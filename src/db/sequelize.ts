import { Sequelize } from 'sequelize'
import { logger } from '../logger'

export const sequelize = new Sequelize('postgres://daniel:@localhost:5432/near_lake_consumer')

export async function connect (): Promise<Sequelize> {
  await sequelize.authenticate()
  logger.info('DB connected.')
  return sequelize
}
