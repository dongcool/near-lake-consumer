import { startStream } from "near-lake-framework";
import { ExecutionOutcomeWithReceipt, LakeConfig, StreamerMessage } from "near-lake-framework/dist/types";
import { markBlock } from '../benchmark';
import { logger } from "../logger";

export interface StreamContext {
  blockHeight: number,
  blockTimestamp: number,
  signerId: string,
  predecessorId: string,
  receiverId: string,
}

export abstract class StreamConsumer {
  private consumedBlockHeight: number = 0;
  private lakeConfig: LakeConfig;

  constructor (
    readonly name: string,
    readonly startBlockHeight: number,
  ) {
    const startBlock = this.consumedBlockHeight !== 0 ? (this.consumedBlockHeight + 1) : startBlockHeight;
    this.lakeConfig = {
      s3BucketName: "near-lake-data-mainnet",
      s3RegionName: "eu-central-1",
      startBlockHeight: startBlock,
    }
  }

  abstract processReceipt (context: StreamContext, receipt: ExecutionOutcomeWithReceipt): Promise<void>;

  async start () {
    await startStream(this.lakeConfig, async (data) => {
      const blockTimestamp = data.block.header.timestamp;
      const blockHeight = data.block.header.height;
      const processPromises = data
        .shards
        .flatMap(shard => shard.receiptExecutionOutcomes)
        .filter(outcome => outcome.receipt && 'Action' in outcome.receipt.receipt)
        .map(outcome => {
          const context: StreamContext = {
            blockHeight,
            blockTimestamp,
            signerId: (outcome.receipt!.receipt as any)['Action']['signerId'],
            predecessorId: outcome.receipt!.predecessorId,
            receiverId: outcome.receipt!.receiverId,
          }

          return this.processReceipt(context, outcome);
        });

      try {
        // TODO begin transaction
        await Promise.all(processPromises);  
        this.consumedBlockHeight = data.block.header.height;
        // TODO commit transaction

        markBlock(this.name, this.consumedBlockHeight);
        const date = new Date(blockTimestamp / 1000000);
        logger.debug(`${this.name} consumed block ${this.consumedBlockHeight} (${date.toISOString()})`);
      } catch (err) {
        logger.error(this.name, 'consumed block failed', this.consumedBlockHeight);
        logger.error(err);
        throw err;
      }
    });
  }
}
