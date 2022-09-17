import { DataTypes, Model } from 'sequelize'
import { logger } from '../logger'
import { sequelize } from './sequelize'

export class Checkpoint extends Model {
  declare id: number
  declare consumer_name: string
  declare consumed_block_height: number

  static async getConsumedBlockHeight (consumerName: string): Promise<number | undefined> {
    const record = await Checkpoint.findOne({
      where: {
        consumer_name: consumerName
      }
    })

    return record?.consumed_block_height
  }

  static async updateCheckpoint (consumerName: string, blockHeight: number): Promise<void> {
    logger.debug(`updating checkpoint ${consumerName} to ${blockHeight}`);
    await Checkpoint.upsert({
      consumer_name: consumerName,
      consumed_block_height: blockHeight
    })
  }
}

Checkpoint.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  consumer_name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  consumed_block_height: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  indexes: [
    {
      unique: true,
      fields: ['consumer_name']
    }
  ],
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
