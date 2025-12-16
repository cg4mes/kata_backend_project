import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  QueryCommandOutput,
  ScanCommandOutput,
  GetCommandOutput,
  UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DynamoDBDatasource {
  private dynamoClient!: DynamoDBClient;
  private docClient!: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly logger = new Logger(DynamoDBDatasource.name);

  constructor() {
    this.tableName =
      process.env.DYNAMODB_TABLE_NAME || 'kata-backend-production';
    this.createInstance();
  }

  private createInstance(): void {
    if (!this.dynamoClient && !this.docClient) {
      const clientConfig: any = {
        region: process.env.AWS_REGION || 'us-east-1',
      };

      // For local development with DynamoDB Local
      if (process.env.DYNAMO_ENDPOINT) {
        clientConfig.endpoint = process.env.DYNAMO_ENDPOINT;
        clientConfig.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
        };
        this.logger.log(`Using DynamoDB Local at ${process.env.DYNAMO_ENDPOINT}`);
      }

      this.dynamoClient = new DynamoDBClient(clientConfig);
      this.docClient = DynamoDBDocumentClient.from(this.dynamoClient, {
        marshallOptions: {
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        },
      });
      this.logger.log('DynamoDB client initialized successfully');
    }
  }

  /**
   * Get an item by PK and SK
   */
  async get(pk: string, sk: string): Promise<any> {
    try {
      const params = {
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      };

      const result: GetCommandOutput = await this.docClient.send(
        new GetCommand(params),
      );
      return result.Item || null;
    } catch (error: any) {
      this.logger.error(`Error getting item: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Put (create or replace) an item
   */
  async put(item: Record<string, any>): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Item: item,
      };

      await this.docClient.send(new PutCommand(params));
      this.logger.debug(`Item created/updated: PK=${item.PK}, SK=${item.SK}`);
    } catch (error: any) {
      this.logger.error(`Error putting item: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Query items by PK (with optional SK condition)
   */
  async query(
    pk: string,
    options?: {
      skBeginsWith?: string;
      skBetween?: [string, string];
      filter?: string;
      filterValues?: Record<string, any>;
      limit?: number;
      scanIndexForward?: boolean;
    },
  ): Promise<any[]> {
    try {
      let keyConditionExpression = 'PK = :pk';
      const expressionAttributeValues: Record<string, any> = { ':pk': pk };

      if (options?.skBeginsWith) {
        keyConditionExpression += ' AND begins_with(SK, :sk)';
        expressionAttributeValues[':sk'] = options.skBeginsWith;
      } else if (options?.skBetween) {
        keyConditionExpression += ' AND SK BETWEEN :sk1 AND :sk2';
        expressionAttributeValues[':sk1'] = options.skBetween[0];
        expressionAttributeValues[':sk2'] = options.skBetween[1];
      }

      const params: any = {
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: options?.scanIndexForward ?? true,
      };

      if (options?.filter) {
        params.FilterExpression = options.filter;
        Object.assign(
          params.ExpressionAttributeValues,
          options.filterValues || {},
        );
      }

      if (options?.limit) {
        params.Limit = options.limit;
      }

      const result: QueryCommandOutput = await this.docClient.send(
        new QueryCommand(params),
      );
      return result.Items || [];
    } catch (error: any) {
      this.logger.error(`Error querying items: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Query using a Global Secondary Index
   */
  async queryGSI(
    indexName: string,
    gsiPK: string,
    options?: {
      gsiSK?: string;
      filter?: string;
      filterValues?: Record<string, any>;
      limit?: number;
    },
  ): Promise<any[]> {
    try {
      const expressionAttributeValues: Record<string, any> = {
        ':gsiPK': gsiPK,
      };
      let keyConditionExpression = `${indexName}PK = :gsiPK`;

      if (options?.gsiSK) {
        keyConditionExpression += ` AND ${indexName}SK = :gsiSK`;
        expressionAttributeValues[':gsiSK'] = options.gsiSK;
      }

      const params: any = {
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };

      if (options?.filter) {
        params.FilterExpression = options.filter;
        Object.assign(
          params.ExpressionAttributeValues,
          options.filterValues || {},
        );
      }

      if (options?.limit) {
        params.Limit = options.limit;
      }

      const result: QueryCommandOutput = await this.docClient.send(
        new QueryCommand(params),
      );
      return result.Items || [];
    } catch (error: any) {
      this.logger.error(`Error querying GSI: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Scan the entire table with optional filter
   * Note: Scan is expensive for large tables. Use query when possible.
   */
  async scan(options?: {
    filter?: string;
    filterValues?: Record<string, any>;
    limit?: number;
  }): Promise<any[]> {
    try {
      const params: any = {
        TableName: this.tableName,
      };

      if (options?.filter) {
        params.FilterExpression = options.filter;
        params.ExpressionAttributeValues = options.filterValues || {};
      }

      if (options?.limit) {
        params.Limit = options.limit;
      }

      const result: ScanCommandOutput = await this.docClient.send(
        new ScanCommand(params),
      );
      
      this.logger.debug(`Scanned ${result.Items?.length || 0} items from table`);
      return result.Items || [];
    } catch (error: any) {
      this.logger.error(`Error scanning table: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Update an item
   */
  async update(
    pk: string,
    sk: string,
    updates: Record<string, any>,
    returnUpdatedItem = false,
  ): Promise<any> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      let index = 0;
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'PK' && key !== 'SK') {
          const nameAlias = `#attr${index}`;
          const valueAlias = `:val${index}`;
          updateExpressions.push(`${nameAlias} = ${valueAlias}`);
          expressionAttributeNames[nameAlias] = key;
          expressionAttributeValues[valueAlias] = value;
          index++;
        }
      }

      const params: any = {
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      };

      if (returnUpdatedItem) {
        params.ReturnValues = 'ALL_NEW';
      }

      const result: UpdateCommandOutput = await this.docClient.send(
        new UpdateCommand(params),
      );
      this.logger.debug(`Item updated: PK=${pk}, SK=${sk}`);
      return result.Attributes || null;
    } catch (error: any) {
      this.logger.error(`Error updating item: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Delete an item
   */
  async delete(pk: string, sk: string): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      };

      await this.docClient.send(new DeleteCommand(params));
      this.logger.debug(`Item deleted: PK=${pk}, SK=${sk}`);
    } catch (error: any) {
      this.logger.error(`Error deleting item: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Batch write (put/delete multiple items)
   */
  async batchWrite(
    items: Array<{ PutRequest?: { Item: any }; DeleteRequest?: { Key: any } }>,
  ): Promise<void> {
    try {
      const params = {
        RequestItems: {
          [this.tableName]: items,
        },
      };

      await this.docClient.send(new BatchWriteCommand(params));
      this.logger.debug(`Batch write completed: ${items.length} items`);
    } catch (error: any) {
      this.logger.error(`Error in batch write: ${error.message}`, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get the table name
   */
  getTableName(): string {
    return this.tableName;
  }
}
