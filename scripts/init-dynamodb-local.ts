import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	CreateTableCommand,
	ListTablesCommand,
	DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
	region: 'us-east-1',
	endpoint: 'http://localhost:8000',
	credentials: {
		accessKeyId: 'local',
		secretAccessKey: 'local',
	},
});

const TABLE_NAME = 'kata-backend-local';

async function createTable() {
	try {
		// Check if table exists
		const listTablesCommand = new ListTablesCommand({});
		const listResult = await client.send(listTablesCommand);

		if (listResult.TableNames?.includes(TABLE_NAME)) {
			console.log(`Table ${TABLE_NAME} already exists. Deleting...`);
			const deleteCommand = new DeleteTableCommand({
				TableName: TABLE_NAME,
			});
			await client.send(deleteCommand);
			console.log('Old table deleted');
			// Wait a bit for the table to be fully deleted
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		const createTableCommand = new CreateTableCommand({
			TableName: TABLE_NAME,
			KeySchema: [
				{ AttributeName: 'PK', KeyType: 'HASH' },
				{ AttributeName: 'SK', KeyType: 'RANGE' },
			],
			AttributeDefinitions: [
				{ AttributeName: 'PK', AttributeType: 'S' },
				{ AttributeName: 'SK', AttributeType: 'S' },
				{ AttributeName: 'GSI1PK', AttributeType: 'S' },
				{ AttributeName: 'GSI1SK', AttributeType: 'S' },
				{ AttributeName: 'GSI2PK', AttributeType: 'S' },
			],
			GlobalSecondaryIndexes: [
				{
					IndexName: 'GSI1',
					KeySchema: [
						{ AttributeName: 'GSI1PK', KeyType: 'HASH' },
						{ AttributeName: 'GSI1SK', KeyType: 'RANGE' },
					],
					Projection: {
						ProjectionType: 'ALL',
					},
					ProvisionedThroughput: {
						ReadCapacityUnits: 5,
						WriteCapacityUnits: 5,
					},
				},
				{
					IndexName: 'GSI2',
					KeySchema: [{ AttributeName: 'GSI2PK', KeyType: 'HASH' }],
					Projection: {
						ProjectionType: 'ALL',
					},
					ProvisionedThroughput: {
						ReadCapacityUnits: 5,
						WriteCapacityUnits: 5,
					},
				},
			],
			BillingMode: 'PROVISIONED',
			ProvisionedThroughput: {
				ReadCapacityUnits: 5,
				WriteCapacityUnits: 5,
			},
		});

		await client.send(createTableCommand);
		console.log(`Table ${TABLE_NAME} created successfully!`);
		console.log('\nTable Structure:');
		console.log('  - Primary Key: PK (HASH), SK (RANGE)');
		console.log('  - GSI1: GSI1PK (HASH), GSI1SK (RANGE) - For email lookups');
		console.log('  - GSI2: GSI2PK (HASH) - For product lookups');
	} catch (error) {
		console.error('Error creating table:', error);
		process.exit(1);
	}
}

createTable();
