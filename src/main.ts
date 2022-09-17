import { linearEventConsumer } from './consumer/LinearEventConsumer'
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
    console.error(err)
    process.exit(1)
  })

// class Model {
//   static create (r: object): Model { return new Model() }
// }

// class User extends Model {
//   static create (r: object): User {
//     console.log('creating new user', r)
//     return new User()
//   }
// }

// function foo<T extends Model> (
//   model: { new (): T, create: (r: object) => T },
//   record: object
// ) {
//   model.create(record)
// }

// foo(User, { name: 'foo' })
