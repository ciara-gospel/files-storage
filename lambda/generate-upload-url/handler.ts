import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { generateUploadUrl } from '../common/s3Service';
import { putMetadata } from '../common/dynamoService';

const BUCKET = process.env.BUCKET_NAME!;
const TABLE = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const { filename, userId } = event.queryStringParameters || {};
  if (!filename || !userId) {
    return { statusCode: 400, body: 'Missing filename or userId' };
  }

  const fileId = uuidv4();
  const key = `${userId}/${fileId}_${filename}`;

  const uploadUrl = await generateUploadUrl(BUCKET, key);

  // Stockage métadonnée
  await putMetadata(TABLE, {
    fileId,
    userId,
    filename,
    s3Key: key,
    createdAt: new Date().toISOString(),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ fileId, uploadUrl }),
  };
};
