import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class FilesStorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔒 S3 Bucket privé
    const fileBucket = new s3.Bucket(this, 'FileStorageBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        { expiration: cdk.Duration.days(7) }
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['http://localhost:5173','http://localhost:5174'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // 🗃️ DynamoDB Table
    const fileTable = new dynamodb.Table(this, 'FileMetadataTable', {
      partitionKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ⚙️ Lambda Upload
    const uploadLambda = new NodejsFunction(this, 'GenerateUploadUrlLambda', {
      entry: path.join(__dirname, '../lambda/generate-upload-url/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        BUCKET_NAME: fileBucket.bucketName,
        TABLE_NAME: fileTable.tableName,
      },
    });

    // ⚙️ Lambda Download
    const downloadLambda = new NodejsFunction(this, 'GenerateDownloadUrlLambda', {
      entry: path.join(__dirname, '../lambda/generate-download-url/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        BUCKET_NAME: fileBucket.bucketName,
        TABLE_NAME: fileTable.tableName,
      },
    });

    // ⚙️ Lambda Delete
    const deleteLambda = new NodejsFunction(this, 'DeleteFileLambda', {
      entry: path.join(__dirname, '../lambda/delete-file/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        BUCKET_NAME: fileBucket.bucketName,
        TABLE_NAME: fileTable.tableName,
      },
    });

    // 🔐 Permissions
    fileBucket.grantReadWrite(uploadLambda);
    fileBucket.grantReadWrite(downloadLambda);
    fileBucket.grantReadWrite(deleteLambda);

    fileTable.grantReadWriteData(uploadLambda);
    fileTable.grantReadWriteData(downloadLambda);
    fileTable.grantReadWriteData(deleteLambda);

    // 🌐 API Gateway
    const api = new apigw.RestApi(this, 'FileStorageApi', {
      restApiName: 'File Storage Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    // Routes
    api.root.addResource('upload-url').addMethod('GET', new apigw.LambdaIntegration(uploadLambda));
    const filesResource = api.root.addResource('files');
    filesResource.addMethod('GET', new apigw.LambdaIntegration(downloadLambda));
    const fileResource = filesResource.addResource('{fileId}');
    fileResource.addMethod('GET', new apigw.LambdaIntegration(downloadLambda));
    fileResource.addMethod('DELETE', new apigw.LambdaIntegration(deleteLambda));
  }
}
