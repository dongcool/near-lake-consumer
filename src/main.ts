import { linearEventConsumer } from './consumer/linear/LinearEventConsumer'
import { StreamConsumer } from './consumer/StreamConsumer'
import { connect, sequelize } from './db/sequelize'
import { logger } from './logger'

async function run (): Promise<void> {
  await connect()
  await sequelize.sync({ alter: true })

  const consumers: StreamConsumer[] = [
    linearEventConsumer
  ]

  for (const consumer of consumers) {
    await consumer.start()
  }
}

run()
  .catch(err => {
    logger.error(err)
    process.exit(1)
  })
