import { linearEventConsumer } from './consumer/linear/LinearEventConsumer'
import { linearTransferEventConsumer } from './consumer/linear/LinearTransferEventConsumer'
import { refWNEARSwapConsumer } from './consumer/ref/RefSwapEventConsumer'
import { StreamConsumer } from './consumer/StreamConsumer'
import { connect, sequelize } from './db/sequelize'
import { logger } from './logger'

async function run (): Promise<void> {
  await connect()
  await sequelize.sync({ alter: true })

  const consumers: StreamConsumer[] = [
    linearEventConsumer,
    linearTransferEventConsumer,
    refWNEARSwapConsumer
  ]

  for (const consumer of consumers) {
    void consumer.start()
  }
}

run()
  .catch(err => {
    logger.error('unhandled error in main')
    logger.error(err)
    process.exit(22)
  })
