import { linearEventConsumer } from './consumer/linear/LinearEventConsumer'
import { linearTransferEventConsumer } from './consumer/linear/LinearTransferEventConsumer'
import { refStnearSwapConsumer } from './consumer/ref/RefSwapEventConsumer'
import { StreamConsumer } from './consumer/StreamConsumer'
import { connect, sequelize } from './db/sequelize'
import { logger } from './logger'

async function run (): Promise<void> {
  await connect()
  await sequelize.sync({ alter: true })

  const consumers: StreamConsumer[] = [
    linearEventConsumer,
    linearTransferEventConsumer,
    refStnearSwapConsumer
  ]

  for (const consumer of consumers) {
    void consumer.start()
  }
}

run()
  .catch(err => {
    logger.error(err)
    process.exit(1)
  })
