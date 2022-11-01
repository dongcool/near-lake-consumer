import { RefSwapEvent } from '../../db/ref/RefSwapEvent'
import { ProcessResult, ReceiptData, StreamConsumer } from '../StreamConsumer'

interface SwapEvent {
  block_height: number
  block_timestamp: Date
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string
}

export class RefSwapEventConsumer extends StreamConsumer {
  constructor (
    readonly name: string,
    readonly startBlockHeight: number,
    readonly tokenAddress: string
  ) {
    super(name, startBlockHeight)
  }

  async processReceipt (data: ReceiptData): Promise<ProcessResult[]> {
    if (data.context.receiverId !== 'v2.ref-finance.near') return []

    // Ref swap logs are lke:
    // Swapped 2221875867401720921993136 meta-pool.near for 2487451465096245291810387 wrap.near
    const regex = /Swapped (\d+) (\S+) for (\d+) ([a-zA-Z0-9._-]+)/

    const events = data.outcome.executionOutcome.outcome.logs.map(
      (log: string): SwapEvent | undefined => {
        const groups = regex.exec(log)
        if (groups == null) return undefined

        return {
          block_height: data.context.blockHeight,
          block_timestamp: new Date(data.context.blockTimestamp),
          token_in: groups[2],
          token_out: groups[4],
          amount_in: groups[1],
          amount_out: groups[3]
        }
      }
    )
      .filter((event): event is SwapEvent => !(event == null))
      .filter(event => event.token_in === this.tokenAddress || event.token_out === this.tokenAddress)

    if (events.length === 0) return []

    return [
      {
        model: RefSwapEvent,
        records: events
      }
    ]
  }
}
