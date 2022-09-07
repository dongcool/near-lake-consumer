import { EventEmitter } from 'events'
import { logger } from './logger'
import _ from 'lodash'

const emitter = new EventEmitter()
const reportInterval = 5000 // 5 sec

let blocks: {[name: string]: number} = {}

export function markBlock (name: string, blockCount: number): void {
  emitter.emit('mark-block', {
    name,
    blockCount
  })
}

emitter.on('mark-block', ({ name, blockCount }) => {
  if (blocks[name] === undefined) {
    blocks[name] = 0
  }

  blocks[name] += blockCount as number
})

setInterval(() => {
  logger.debug(' === Benchmark (#blocks/sec) === ')

  const matrix = _.mapValues(blocks, count => count / (reportInterval / 1000))

  logger.debug(matrix)
  blocks = {}
}, reportInterval)
