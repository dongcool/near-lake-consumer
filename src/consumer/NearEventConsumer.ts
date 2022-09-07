import { ExecutionOutcomeWithReceipt, StreamerMessage } from "near-lake-framework/dist/types";
import { StreamConsumer, StreamContext } from "./StreamConsumer";

type EventHandler = (context: StreamContext, events: NearEvent[]) => Promise<void>;

// Interface to capture data about an event
// Arguments
// * `standard`: name of standard, e.g. nep171
// * `version`: e.g. 1.0.0
// * `event`: type of the event, e.g. nft_mint
// * `data`: associate event data. Strictly typed for each set {standard, version, event} inside corresponding NEP
interface NearEvent {
  standard: string,
  version: string,
  event: string,
  data?: unknown,
};

export class NearEventConsumer extends StreamConsumer {
  constructor(
    readonly name: string,
    readonly startBlockHeight: number,
    readonly handler: EventHandler,
    readonly eventStandard: string,
    readonly eventName?: string,
    readonly eventVersion?: string,
  ) {
    super(name, startBlockHeight);
  }

  async processReceipt(context: StreamContext, receipt: ExecutionOutcomeWithReceipt): Promise<void> {
    const events = receipt.executionOutcome.outcome.logs.map(
      (log: string): NearEvent | undefined => {
        const [_, probablyEvent] = log.match(/^EVENT_JSON:(.*)$/) ?? [];
        try {
          return JSON.parse(probablyEvent);
        } catch (e) {
          return;
        }
      }
    )
      .filter((event): event is NearEvent => !!event)
      .map(event => {
        return event;
      })
      .filter(event =>
        (event.standard === this.eventStandard)
          && (!this.eventName || event.event === this.eventName)
          && (!this.eventVersion || event.version === this.eventVersion)
      );

    if (events.length === 0) return;

    await this.handler(context, events);
  }
}
