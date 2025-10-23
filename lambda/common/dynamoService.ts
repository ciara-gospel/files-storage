import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

export const putMetadata = async (tableName: string, item: any) => {
  await dynamo.put({
    TableName: tableName,
    Item: item,
  }).promise();
};

export const getMetadata = async (tableName: string, fileId: string) => {
  const res = await dynamo.get({
    TableName: tableName,
    Key: { fileId },
  }).promise();
  return res.Item;
};

export const deleteMetadata = async (tableName: string, fileId: string) => {
  await dynamo.delete({
    TableName: tableName,
    Key: { fileId },
  }).promise();
};
