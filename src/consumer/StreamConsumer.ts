import { startStream } from 'near-lake-framework'
import { ExecutionOutcomeWithReceipt, LakeConfig } from 'near-lake-framework/dist/types'
import { markBlock } from '../benchmark'
import { Checkpoint } from '../db/Checkpoint'
import { logger } from '../logger'
import config from 'config';

export interface StreamContext {
  blockHeight: number
  blockTimestamp: number
  signerId: string
  predecessorId: string
  receiverId: string
}

export interface ReceiptData {
  context: StreamContext
  outcome: ExecutionOutcomeWithReceipt
}

export abstract class StreamConsumer {
  private readonly batchBlockSize = 20
  private lastSavedBlockHeight: number | undefined;

  constructor (
    readonly name: string,
    readonly startBlockHeight: number
  ) {
  }

  abstract processReceipt (data: ReceiptData): Promise<void>

  async start (): Promise<void> {
    let receiptBatch: ReceiptData[] = []

    const consumedBlockHeight = await Checkpoint.getConsumedBlockHeight(this.name);
    const startBlockHeight = consumedBlockHeight ? consumedBlockHeight + 1 : this.startBlockHeight
    const lakeConfig = {
      s3BucketName: config.get<string>('nearLake.s3BucketName'),
      s3RegionName: config.get<string>('nearLake.s3RegionName'),
      startBlockHeight
    }

    logger.info(`[${this.name}] started from block ${startBlockHeight}`)

    // the processing results of blocks before this one have been saved in db
    this.lastSavedBlockHeight = consumedBlockHeight

    await startStream(lakeConfig, async (data) => {
      const blockTimestamp = data.block.header.timestamp
      const blockHeight = data.block.header.height
      logger.debug(`===> Process block ${blockHeight}`);
      this.lastSavedBlockHeight ||= blockHeight

      const receiptData: ReceiptData[] = data
        .shards
        .flatMap(shard => shard.receiptExecutionOutcomes)
        .filter(outcome => (outcome.receipt != null) && 'Action' in outcome.receipt.receipt)
        .map(outcome => {
          const context: StreamContext = {
            blockHeight,
            blockTimestamp,
            signerId: (outcome.receipt!.receipt as any).Action.signerId, // eslint-disable-line
            predecessorId: outcome.receipt!.predecessorId, // eslint-disable-line
            receiverId: outcome.receipt!.receiverId // eslint-disable-line
          }

          return {
            context,
            outcome
          }
        })

      receiptBatch = receiptBatch.concat(...receiptData)

      if (blockHeight >= this.lastSavedBlockHeight + this.batchBlockSize) {
        try {
          await Promise.all(receiptBatch.map(async r => await this.processReceipt(r)))
          // await Checkpoint.updateCheckpoint(this.name, blockHeight)
          logger.debug(`[${this.name}] Processed receipt of blocks ${this.lastSavedBlockHeight} - ${blockHeight}`)
        } catch (err) {
          logger.error(`[${this.name}] Process receipts failed for blocks ${this.lastSavedBlockHeight} - ${blockHeight}`)
          throw err
        }

        markBlock(this.name, blockHeight - this.lastSavedBlockHeight)

        logger.warn(`Updating lastSaved from ${this.lastSavedBlockHeight} to ${blockHeight}`);
        this.lastSavedBlockHeight = blockHeight
        receiptBatch = []
      }
      logger.debug(`===< End of process block ${blockHeight}`)
    })
  }
}
