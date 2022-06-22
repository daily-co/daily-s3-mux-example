import * as https from 'https';
import * as util from 'util';
import { S3Event, Context, Callback } from 'aws-lambda';

export const handler = (
  event: S3Event,
  context: Context,
  callback: Callback
) => {
  // Read options from the event parameter.
  console.log(
    'Reading options from event:\n',
    util.inspect(event, { depth: 5 })
  );
  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );

  const input = `https://${srcBucket}.s3.amazonaws.com/${srcKey}`;

  const data = JSON.stringify({
    input,
    playback_policy: 'public',
  });

  const authString = Buffer.from(
    process.env.MUX_TOKEN_ID + ':' + process.env.MUX_TOKEN_SECRET
  ).toString('base64');

  const options: https.RequestOptions = {
    hostname: 'api.mux.com',
    path: '/video/v1/assets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: 'Basic ' + authString,
    },
  };

  const req = https
    .request(options, (res) => {
      let data = '';

      console.log('Status Code:', res.statusCode);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.error) {
          callback(result.error);
        } else {
          callback(null, result);
        }
      });
    })
    .on('error', (err) => {
      console.error('Error: ', err.message);
      callback(err);
    });

  req.write(data);
  req.end();
};
