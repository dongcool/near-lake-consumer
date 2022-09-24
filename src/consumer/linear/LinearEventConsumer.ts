import config from 'config'
import { LinearEpochUpdateRewardsEvent } from '../../db/linear/LinearEpochUpdateRewardsEvent'
import { logger } from '../../logger'
import { NearEventConsumer } from '../NearEventConsumer'

export const linearEventConsumer = new NearEventConsumer(
  'linear-event-consumer',
  config.get('consumer.linear.startBlock'),
  async (ctx, events) => {
    logger.debug('---- linear events ----')
    logger.debug(JSON.stringify(events, undefined, 4))

    const epochUpdateRewardEvents = events
      .filter(event => event.event === 'epoch_update_rewards')
      .flatMap(event => event.data.map(data => {
        return {
          block_height: ctx.blockHeight,
          block_timestamp: new Date(ctx.blockTimestamp),
          standard: event.standard,
          version: event.version,
          event: event.event,
          validator_id: data.validator_id,
          old_balance: data.old_balance,
          new_balance: data.new_balance,
          rewards: data.rewards
        }
      }))

    return [
      {
        model: LinearEpochUpdateRewardsEvent,
        records: epochUpdateRewardEvents
      }
    ]
  },
  'linear'
)
