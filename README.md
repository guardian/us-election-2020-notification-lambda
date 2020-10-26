# notification-lambda

## How to update the lambda code

1. Save changes in `notification-lambda.js`
2. In `notification-dispatch-lambda.yaml` CloudFormation template, find the `Resources -> Function -> Properties -> Code -> S3Key` property and increment the "version number" before the `.zip` file extension.
3. Create a zip file containing `notification-lambda.js` and give that zip the same name as what you just put as the `S3Key` above.
4. Upload the zip to the location specified in the CloudFormation template.
5. Update the CloudFormation stack. This will update the Lambda function and cause it to use the new code in the new version of the zip file that you just uploaded.
