import { APIGatewayProxyHandler } from 'aws-lambda';
import { deleteFile } from '../common/s3Service';
import { getMetadata, deleteMetadata } from '../common/dynamoService';

const BUCKET = process.env.BUCKET_NAME!;
const TABLE = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const fileId = event.pathParameters?.fileId;
  if (!fileId) return { statusCode: 400, body: 'Missing fileId' };

  const metadata = await getMetadata(TABLE, fileId);
  if (!metadata) return { statusCode: 404, body: 'File not found' };

  await deleteFile(BUCKET, metadata.s3Key);
  await deleteMetadata(TABLE, fileId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'File deleted successfully', fileId }),
  };
};
