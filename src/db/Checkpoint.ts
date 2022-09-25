import { DataTypes, Model, Transaction } from 'sequelize'
import { sequelize } from './sequelize'

export class Checkpoint extends Model {
  declare id: number
  declare consumer_name: string
  declare consumed_block_height: number

  /**
   *
   * @param consumerName
   * @param blockHeight
   * @param txn
   * @returns returns undefined if this checkpoint has already been processed
   */
  static async createCheckpoint (consumerName: string, blockHeight: number, txn: Transaction): Promise<Checkpoint | undefined> {
    const record = await Checkpoint.findOne({
      where: {
        consumer_name: consumerName,
        consumed_block_height: blockHeight
      },
      transaction: txn
    })
    if (record != null) return

    return await Checkpoint.create({
      consumer_name: consumerName,
      consumed_block_height: blockHeight
    }, {
      transaction: txn
    })
  }

  static async latestCheckpoint (consumerName: string): Promise<Checkpoint | null> {
    return await Checkpoint.findOne({
      where: {
        consumer_name: consumerName
      },
      order: [
        ['consumed_block_height', 'DESC']
      ]
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
      fields: ['consumer_name', 'consumed_block_height']
    }
  ],
  tableName: 'checkpoints',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
