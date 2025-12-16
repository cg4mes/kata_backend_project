import { Module, Global } from '@nestjs/common';
import { DynamoDBDatasource } from './datasources/dynamodb.datasource';

@Global()
@Module({
  providers: [DynamoDBDatasource],
  exports: [DynamoDBDatasource],
})
export class DynamoDBModule {}
