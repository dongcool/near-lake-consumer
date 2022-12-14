import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../sequelize'

export class LinearEpochUpdateRewardsEvent extends Model {
}

LinearEpochUpdateRewardsEvent.init({
  block_height: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  block_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // NEAR event fields
  standard: {
    type: DataTypes.STRING,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // event specific fields
  validator_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  old_balance: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  new_balance: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  rewards: {
    type: DataTypes.DECIMAL,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'linear_epoch_update_rewards_events',
  indexes: [
    {
      fields: ['block_height']
    }
  ],
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
