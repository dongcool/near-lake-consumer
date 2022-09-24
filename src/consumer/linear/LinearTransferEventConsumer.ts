import { NearEventConsumer } from '../NearEventConsumer'
import config from 'config'
import { logger } from '../../logger'
import { TokenTransferEvent } from '../../db/TokenTransferEvent'

export const linearTransferEventConsumer = new NearEventConsumer(
  'linear-transfer-event-consumer',
  config.get('consumer.linearTransfer.startBlock'),
  async (ctx, events) => {
    if (ctx.receiverId !== 'linear-protocol.near') return []

    logger.debug('---- linear transfer events ----')
    logger.debug(JSON.stringify(events, undefined, 4))

    const linearTransferEvents = events
      .flatMap(event => {
        return event.data.map(data => {
          const record = {
            block_height: ctx.blockHeight,
            block_timestamp: ctx.blockTimestamp,
            token_address: ctx.receiverId,
            sender: null,
            receiver: null,
            amount: data.amount,
            memo: data.memo
          }

          if (event.event === 'ft_mint') {
            record.receiver = data.owner_id
          } else if (event.event === 'ft_burn') {
            record.sender = data.owner_id
          } else {
            record.sender = data.old_owner_id
            record.receiver = data.new_owner_id
          }

          return record
        })
      })

    return [
      {
        model: TokenTransferEvent,
        records: linearTransferEvents
      }
    ]
  },
  'nep141'
)
