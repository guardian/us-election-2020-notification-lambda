// dependencies
const AWS = require('aws-sdk');
const https = require('https');

// get reference to S3 client
const s3 = new AWS.S3();
const srcBucket = "gdn-cdn";

async function getLastUpdated() {
    const srcKey = "2020/11/us-general-election-data/max/last_updated.json";
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    return s3.getObject(params).promise().then(function(data) {
        if (data.Body) {
            const body = data.Body.toString()
            const lastUpdated = JSON.parse(body)
            const lastUpdatedTimestamp = lastUpdated["time"]
            console.log("Last updated: " + lastUpdatedTimestamp)
            return lastUpdatedTimestamp
        } else {
            throw "S3 output body was not defined"  
        }
    })
}

async function getNotificationData(lastUpdatedTimestamp) {
    const srcKey = "2020/11/us-general-election-data/max/data-out/" + lastUpdatedTimestamp + "/notification_data.json";
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    return s3.getObject(params).promise().then(function(data) {
        if (data.Body) {
            const body = data.Body.toString()
            console.log("Notification data: " + body)
            return body
        } else {
            throw "S3 output body was not defined"  
        }
    })
}

function postNotificationData(notificationData) {
    const requestParams = {
        host: "notification.notifications.code.dev-guardianapis.com",
        path: "/push/topic",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer us-elections-2020-8a102cbc-b556-4218-89ff-e4f89da9ba0e"
            //"Content-Length": Buffer.byteLength(notificationData)
        }
    }

    /*
    const request = https.request(requestParams, function(response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            console.log('NOTIFICATION DATA WAS SENT, response was: ' + chunk);
            context.succeed();
        });
        response.on('error', function (e) {
            console.log("ERROR SENDING NOTIFICATION DATA: " + e.message);
            context.done(null, 'FAILURE');
        });
    });

    request.write(notificationData)
    request.end()
    */

    return new Promise((resolve, reject) => {
        
        //create the request object with the callback with the result
        const req = https.request(requestParams, (res) => {
          resolve(JSON.stringify(res.statusCode));
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

exports.handler =  async function(event, context) {
    console.log("EVENT: \n" + JSON.stringify(event, null, 2))
    
    const lastUpdatedTimestamp = await getLastUpdated()

    const notificationData = await getNotificationData(lastUpdatedTimestamp)
    
    console.log("Got the notification data LETSSS GOOO: " + notificationData)

    await postNotificationData(notificationData).then( response =>
        console.log("NOTIFICATION DATA SENT SUCCESSFULLY, response: " + response)
    ).catch( err =>
        console.log("ERROR SENDING NOTIFICATION DATA: " + err)
    )
    
    return context.logStreamName
}