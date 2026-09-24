import { SQSClient } from '@aws-sdk/client-sqs';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

export const sqsClient = new SQSClient({
  region: AWS_REGION,
  ...(process.env.AWS_SQS_ENDPOINT ? { endpoint: process.env.AWS_SQS_ENDPOINT } : {})
});
