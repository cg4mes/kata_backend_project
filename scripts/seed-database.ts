import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcrypt';

const client = new DynamoDBClient({
	region: 'us-east-1',
	endpoint: 'http://localhost:8000',
	credentials: {
		accessKeyId: 'local',
		secretAccessKey: 'local',
	},
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'kata-backend-local';

async function seedDatabase() {
	try {
		console.log('🌱 Seeding database...\n');

		// Create admin user
		const adminPassword = await bcrypt.hash('admin123', 10);
		const adminUser = {
			PK: 'USER#admin',
			SK: 'PROFILE',
			GSI1PK: 'EMAIL#admin@kata.com',
			GSI1SK: 'USER#admin',
			email: 'admin@kata.com',
			username: 'admin',
			password: adminPassword,
			role: 'admin',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await docClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: adminUser,
			})
		);
		console.log('✅ Admin user created:');
		console.log('   Email: admin@kata.com');
		console.log('   Password: admin123');
		console.log('   Role: admin\n');

		// Create regular user
		const userPassword = await bcrypt.hash('user123', 10);
		const regularUser = {
			PK: 'USER#testuser',
			SK: 'PROFILE',
			GSI1PK: 'EMAIL#user@kata.com',
			GSI1SK: 'USER#testuser',
			email: 'user@kata.com',
			username: 'testuser',
			password: userPassword,
			role: 'user',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await docClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: regularUser,
			})
		);
		console.log('✅ Regular user created:');
		console.log('   Email: user@kata.com');
		console.log('   Password: user123');
		console.log('   Role: user\n');

		console.log('🎉 Database seeded successfully!');
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		process.exit(1);
	}
}

seedDatabase();
