import config from 'config';
import { logger } from '../logger';
import { NearEventConsumer } from "./NearEventConsumer";

export const linearEventConsumer = new NearEventConsumer(
  'linear-event-consumer',
  config.get('consumer.linear.startBlock'),
  async (ctx, events) => {
    // logger.info('---- linear events ----');
    // logger.info(events);
  },
  'linear'
);
