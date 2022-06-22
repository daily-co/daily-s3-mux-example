import * as cdk from 'aws-cdk-lib';

export class MuxStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myDailyRecordingsBucket = new cdk.aws_s3.Bucket(
      this,
      'MyDailyRecordings',
      {
        versioned: true,
        enforceSSL: true,
        accessControl: cdk.aws_s3.BucketAccessControl.PUBLIC_READ,
        publicReadAccess: true,
        // DO NOT ENABLE THESE IN PRODUCTION
        // This will permenantly delete all files in the bucket
        // when the stack is deleted. This is helpful for testing a
        // proof of concept but will be disastorous in production.
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const role = new cdk.aws_iam.Role(this, 'MuxExternal', {
      description: "Role for Mux's external API",
      maxSessionDuration: cdk.Duration.hours(12),
      assumedBy: new cdk.aws_iam.AccountPrincipal('291871421005'),
      externalIds: ['hush'],
    });

    role.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'VisualEditor0',
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:ListBucketMultipartUploads',
          's3:AbortMultipartUpload',
          's3:ListBucketVersions',
          's3:ListBucket',
          's3:GetObjectVersion',
          's3:ListMultipartUploadParts',
        ],
        // Connects the bucket to the role
        resources: [
          myDailyRecordingsBucket.bucketArn,
          myDailyRecordingsBucket.arnForObjects('*'),
        ],
      })
    );

    // lambda to send a POST reques to mux
    const uploadToMuxLambdaFn = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'uploadToMuxLambda',
      {
        awsSdkConnectionReuse: true,
        entry: './resources/upload-to-mux-lambda.ts',
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        environment: {
          MUX_TOKEN_ID: process.env.MUX_TOKEN_ID || '',
          MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET || '',
        },
        handler: 'handler',
        memorySize: 256,
        logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        tracing: cdk.aws_lambda.Tracing.ACTIVE,
      }
    );

    myDailyRecordingsBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
      new cdk.aws_s3_notifications.LambdaDestination(uploadToMuxLambdaFn)
    );
  }
}
