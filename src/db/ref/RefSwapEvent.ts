import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../sequelize'

export class RefSwapEvent extends Model {
}

RefSwapEvent.init({
  block_height: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  block_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  token_in: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token_out: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount_in: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  amount_out: {
    type: DataTypes.DECIMAL,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'ref_swap_events',
  indexes: [
    {
      fields: ['block_height']
    }
  ],
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
