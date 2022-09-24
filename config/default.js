module.exports = {
  logger: {
    level: 'debug'
  },
  nearLake: {
    s3BucketName: 'near-lake-data-mainnet',
    s3RegionName: 'eu-central-1',
  },
  postgres: {
    username: 'postgres',
    password: '',
    hostname: 'localhost',
    database: 'near_lake_consumer',
    logging: false,
  },
  consumer: {
    linear: {
      startBlock: 73629844
    },
    linearTransfer: {
      startBlock: 74575910
    }
  }
}
