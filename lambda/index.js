console.log('start-lambda', 'Iniciando lambda...');
const isInLambda = !!process.env.LAMBDA_TASK_ROOT;

if (isInLambda) {
	const app = require('../dist/lambda');
	exports.handler = app.handler;
} else {
	console.error('Error executing as lambda.');
}
