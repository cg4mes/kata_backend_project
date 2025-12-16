#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KataBackendStack } from '../lib/kata-backend-stack';

const app = new cdk.App();

// Production environment
const _productionStack = new KataBackendStack(app, 'KataBackendProductionStack', {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: 'us-east-1',
	},
	stage: 'production',
	tags: {
		Environment: 'production',
		Project: 'kata-backend',
		ManagedBy: 'CDK',
	},
});

// Staging environment
const _stagingStack = new KataBackendStack(app, 'KataBackendStagingStack', {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: 'us-east-1',
	},
	stage: 'staging',
	tags: {
		Environment: 'staging',
		Project: 'kata-backend',
		ManagedBy: 'CDK',
	},
});

app.synth();
