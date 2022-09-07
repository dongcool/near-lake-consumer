import { startStream } from 'near-lake-framework'
import { ExecutionOutcomeWithReceipt, LakeConfig } from 'near-lake-framework/dist/types'
import { markBlock } from '../benchmark'
import { logger } from '../logger'

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
  private readonly consumedBlockHeight: number = 0
  private readonly lakeConfig: LakeConfig
  private readonly batchBlockSize = 20

  constructor (
    readonly name: string,
    readonly startBlockHeight: number
  ) {
    // TODO read from db
    const startBlock = this.consumedBlockHeight !== 0 ? (this.consumedBlockHeight + 1) : startBlockHeight
    this.lakeConfig = {
      s3BucketName: 'near-lake-data-mainnet',
      s3RegionName: 'eu-central-1',
      startBlockHeight: startBlock
    }
  }

  abstract processReceipt (data: ReceiptData): Promise<void>

  async start (): Promise<void> {
    let receiptBatch: ReceiptData[] = []

    // the processing results of blocks before this one have been saved in db
    let lastSavedBlockHeight: number

    await startStream(this.lakeConfig, async (data) => {
      const blockTimestamp = data.block.header.timestamp
      const blockHeight = data.block.header.height
      lastSavedBlockHeight ||= blockHeight

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

      if (blockHeight >= lastSavedBlockHeight + this.batchBlockSize) {
        try {
          await Promise.all(receiptBatch.map(async r => await this.processReceipt(r)))
          // TODO record progress in db
          logger.debug(`[${this.name}] Processed receipt of blocks ${lastSavedBlockHeight} - ${blockHeight}`)

          markBlock(this.name, blockHeight - lastSavedBlockHeight)

          lastSavedBlockHeight = blockHeight
          receiptBatch = []
        } catch (err) {
          logger.error(`[${this.name}] Process receipts failed for blocks ${lastSavedBlockHeight} - ${blockHeight}`)
          throw err
        }
      }
    })
  }
}
