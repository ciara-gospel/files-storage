import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export const generateUploadUrl = async (bucketName: string, key: string, expiresSeconds = 900) => {
  return s3.getSignedUrlPromise('putObject', {
    Bucket: bucketName,
    Key: key,
    Expires: expiresSeconds,
  });
};

export const generateDownloadUrl = async (bucketName: string, key: string, expiresSeconds = 900) => {
  return s3.getSignedUrlPromise('getObject', {
    Bucket: bucketName,
    Key: key,
    Expires: expiresSeconds,
  });
};

export const deleteFile = async (bucketName: string, key: string) => {
  return s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
};
