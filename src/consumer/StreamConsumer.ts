import { startStream } from 'near-lake-framework'
import { ExecutionOutcomeWithReceipt, StreamerMessage } from 'near-lake-framework/dist/types'
import { markBlock } from '../benchmark'
import { Checkpoint } from '../db/Checkpoint'
import { logger } from '../logger'
import config from 'config'
import { sequelize } from '../db/sequelize'
import { BulkCreateOptions, Model, Optional } from 'sequelize/types'

export interface StreamContext {
  blockHeight: number
  blockTimestamp: number // timestamp in ms
  signerId: string
  predecessorId: string
  receiverId: string
}

export interface ReceiptData {
  context: StreamContext
  outcome: ExecutionOutcomeWithReceipt
}

export interface ProcessResult {
  model: { new(): Model, bulkCreate: (r: Array<Optional<any, string>>, options?: BulkCreateOptions) => Promise<any> }
  records: any[]
}

export abstract class StreamConsumer {
  constructor (
    readonly name: string,
    readonly startBlockHeight: number
  ) {
  }

  abstract processReceipt (data: ReceiptData): Promise<ProcessResult[]>

  async start (): Promise<void> {
    // resume consuming
    // start from 20 blocks ahead of latest checkpoint in case
    // there are missing blocks that have not been recorded
    const latestCheckpoint = await Checkpoint.latestCheckpoint(this.name)
    const startBlockHeight = latestCheckpoint === null
      ? this.startBlockHeight
      : Math.max(this.startBlockHeight, latestCheckpoint.consumed_block_height - 20)

    const lakeConfig = {
      s3BucketName: config.get<string>('nearLake.s3BucketName'),
      s3RegionName: config.get<string>('nearLake.s3RegionName'),
      startBlockHeight
    }

    logger.info(`[${this.name}] started from block ${startBlockHeight}`)

    await startStream(lakeConfig, async (data) => {
      try {
        await this.onStreamMessage(data)
      } catch (err: any) {
        const allowFailure = process.env.ALLOW_FAILURE !== undefined
        if (allowFailure) {
          logger.error(err)
          logger.error(err.stack)
        } else {
          // this will cause the entire node process to exit
          throw err
        }
      }
    })
  }

  private async onStreamMessage (data: StreamerMessage): Promise<void> {
    const blockTimestamp = Math.round(data.block.header.timestamp / 1000000) // to ms
    const blockHeight = data.block.header.height
    logger.debug(`===> Process block ${blockHeight}`)

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

    const processResults: ProcessResult[] = []
    for (const receipt of receiptData) {
      try {
        const results = await this.processReceipt(receipt)
        processResults.push(...results)
      } catch (err: any) {
        logger.error(`[${this.name}] Failed to process block ${blockHeight}`)
        throw err
      }
    }

    if (processResults.length > 0) {
      await sequelize.transaction(async t => {
        const cp = await Checkpoint.createCheckpoint(this.name, blockHeight, t)
        if (cp === undefined) {
          logger.debug(`[${this.name}] block ${blockHeight} already processed, skipping...`)
          return
        }

        for (const result of processResults) {
          await result.model.bulkCreate(result.records, { transaction: t })
        }
      })
    }

    markBlock(this.name, 1)
    logger.debug(`===< End of process block ${blockHeight}`)
  }
}
