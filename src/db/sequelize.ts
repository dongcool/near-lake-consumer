import { Sequelize } from 'sequelize'
import { logger } from '../logger'
import config from 'config'

const pgConfig: {[key: string]: string} = config.get('postgres')

export const sequelize = new Sequelize(`postgres://${pgConfig.username}:${pgConfig.password}@${pgConfig.hostname}:5432/${pgConfig.database}`, {
  logging: config.get<boolean>('postgres.logging')
})

export async function connect (): Promise<Sequelize> {
  await sequelize.authenticate()
  logger.info('DB connected.')
  return sequelize
}
