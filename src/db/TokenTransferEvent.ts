import { Model, DataTypes } from 'sequelize'
import { sequelize } from './sequelize'

export class TokenTransferEvent extends Model {
}

TokenTransferEvent.init({
  block_height: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  block_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  token_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiver: {
    type: DataTypes.STRING,
    allowNull: true
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  memo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'token_transfer_events',
  indexes: [
    {
      fields: ['block_height']
    },
    {
      fields: ['token_address']
    }
  ],
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
