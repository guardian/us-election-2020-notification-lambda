// dependencies
const AWS = require('aws-sdk');
const https = require('https');

// get reference to S3 client
const s3 = new AWS.S3();
const srcBucket = "gdn-cdn";
const dataDirectory = process.env.ElectionsDataDirectory;
const notificationsEndpoint = process.env.NotificationsEndpoint;

async function getLastUpdated() {
    const srcKey = `${dataDirectory}last_updated.json`;
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    return s3.getObject(params).promise().then(function(data) {
        if (data.Body) {
            const body = data.Body.toString();
            const lastUpdated = JSON.parse(body);
            const lastUpdatedTimestamp = lastUpdated["time"];
            console.log("Last updated: " + lastUpdatedTimestamp);
            return lastUpdatedTimestamp
        } else {
            throw "S3 output body was not defined"
        }
    })
}

async function getNotificationData(lastUpdatedTimestamp) {
    const srcKey = `${dataDirectory}data-out/${lastUpdatedTimestamp}/notification_data.json`;
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    return s3.getObject(params).promise().then(function(data) {
        if (data.Body) {
            const body = data.Body.toString();
            console.log("Notification data: " + body);
            return body
        } else {
            throw "S3 output body was not defined"
        }
    })
}

function postNotificationData(notificationData) {
    const requestParams = {
        host: notificationsEndpoint,
        path: "/push/topic",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.NotificationApiKey
        }
    };

    return new Promise((resolve, reject) => {

        //create the request object with the callback with the result
        const req = https.request(requestParams, (res) => {
          resolve(res.statusCode);
        });

        // handle the possible errors
        req.on('error', (e) => {
          reject(e.message);
        });

        //do the request
        req.write(notificationData);

        //finish the request
        req.end();
      });
}

exports.handler =  async function (event, _) {

    const lastUpdatedTimestamp = await getLastUpdated();

    const notificationData = await getNotificationData(lastUpdatedTimestamp);

    if (process.env.SendingEnabled === "true") {
        try {
            const response = await postNotificationData(notificationData);
            if (response === 200) {
                console.log("Notification data sent successfully")
            } else {
                console.log("Failed to send notification, API returned: " + response)
            }
        } catch (err) {
            console.log("Error sending notification data: " + err);
            throw err
        }
    } else {
        console.log("Sending notifications is disabled, to send notifications set SendingEnabled environment variable to true")
    }
};
