import { EventEmitter } from 'events';
import { logger } from './logger';

const emitter = new EventEmitter();

let blocks: {[name: string]: number} = {};

export function markBlock (name: string, blockNum: number) {
  emitter.emit('mark-block', {
    name,
    blockNum,
  });
}

emitter.on('mark-block', data => {
  const { name, blockNum } = data;
  if (blocks[name] === undefined) {
    blocks[name] = 0;
  }

  blocks[name] += 1;
});

setInterval(() => {
  logger.debug(' === Benchmark === ');
  logger.debug(blocks);
  blocks = {};
}, 1000);
