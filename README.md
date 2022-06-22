# S3 Amazon Lambda to Mux Example

This sets up the infrastructure (IAM permissions, lambda function, and s3 bucket) to automatically POST to Mux every time Daily saves a video to the s3 bucket.

# Key files

- [Lambda Function](./resources/upload-to-mux-lambda.ts): Contains logic to automatically upload a video to mux when a file is saved to S3.
- [AWS Stack Definition](./lib/mux-stack.ts): Sets up s3, lambda, and all the related IAM roles.

# Requirements

- [AWS CLI](https://aws.amazon.com/cli/) installed with AWS secrets setup to deploy.

The following environment variables must be set:

- MUX_TOKEN_ID: Your Mux token ID
- MUX_TOKEN_SECRET: Your Mux token secret

# Deploying

Run the following:

```
npm install
npx cdk bootstrap
npx cdk deploy
```

# Connecting Daily to s3

This code accomplishes everything from the [store daily call recordings in a custom Amazon S3 bucket](https://docs.daily.co/guides/products/live-streaming-recording/storing-recordings-in-a-custom-s3-bucket) article. The last step is to send a POST request to enable Daily to write to an s3 bucket.

You can find your bucket name and region by searching for "muxstack" in the [AWS S3 Console](https://s3.console.aws.amazon.com/s3/buckets).

The role name is found in the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/roles).

```bash
curl --request POST \
  --url https://api.daily.co/v1/ \
  --header 'Authorization: Bearer $DAILY_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "properties": {
      "recordings_bucket": {
        "bucket_name": "AWS_BUCKET_NAME",
        "bucket_region": "us-west-2",
        "assume_role_arn": "arn:aws:iam::1234567890:role/AWS_ROLE_NAME",
        "allow_api_access": true
      }
    }
  }'
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with the current state
- `cdk synth` emits the synthesized CloudFormation template
