module.exports = {
  logger: {
    level: 'debug'
  },
  nearLake: {
    s3BucketName: 'near-lake-data-mainnet',
    s3RegionName: 'eu-central-1',
  },
  consumer: {
    linear: {
      startBlock: 73629844
    }
  }
}
