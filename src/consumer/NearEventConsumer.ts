import { ProcessResult, ReceiptData, StreamConsumer, StreamContext } from './StreamConsumer'

type EventHandler = (context: StreamContext, events: NearEvent[]) => Promise<ProcessResult[]>

// Interface to capture data about an event
// Arguments
// * `standard`: name of standard, e.g. nep171
// * `version`: e.g. 1.0.0
// * `event`: type of the event, e.g. nft_mint
// * `data`: associate event data. Strictly typed for each set {standard, version, event} inside corresponding NEP
interface NearEvent {
  standard: string
  version: string
  event: string
  data: Array<{[key: string]: any}>
};

export class NearEventConsumer extends StreamConsumer {
  constructor (
    readonly name: string,
    readonly startBlockHeight: number,
    readonly handler: EventHandler,
    readonly eventStandard: string,
    readonly eventName?: string,
    readonly eventVersion?: string
  ) {
    super(name, startBlockHeight)
  }

  async processReceipt (data: ReceiptData): Promise<ProcessResult[]> {
    const events = data.outcome.executionOutcome.outcome.logs.map(
      (log: string): NearEvent | undefined => {
        const [, probablyEvent] = log.match(/^EVENT_JSON:(.*)$/) ?? []
        try {
          return JSON.parse(probablyEvent)
        } catch (e) {
          return undefined
        }
      }
    )
      .filter((event): event is NearEvent => !(event == null))
      .map(event => {
        return event
      })
      .filter(event =>
        (event.standard === this.eventStandard) &&
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        (!this.eventName || event.event === this.eventName) &&
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        (!this.eventVersion || event.version === this.eventVersion)
      )

    if (events.length === 0) return []

    return await this.handler(data.context, events)
  }
}
