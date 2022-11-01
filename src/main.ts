import config from 'config';
import { RefSwapEventConsumer } from './consumer/ref/RefSwapEventConsumer'
import { StreamConsumer } from './consumer/StreamConsumer'
import { connect, sequelize } from './db/sequelize'
import { logger } from './logger'

async function run (): Promise<void> {
  await connect()
  await sequelize.sync({ alter: true })

  const consumers: StreamConsumer[] = [
    new RefSwapEventConsumer(
      config.get('consumer.refSwapWNEAR.name'),
      config.get('consumer.refSwapWNEAR.startBlock'),
      config.get('consumer.refSwapWNEAR.tokenAddress'),
    ),
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
