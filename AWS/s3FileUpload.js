/* ---------------------------------------------- */
//public bucket

//Require Package
const AWS = require("aws-sdk");

//S3 Configurationgist
const s3 = new AWS.S3({
  accessKeyId: "< access key ID >",
  secretAccessKey: "< secret access key >",
  region: "< region >", //Optional
});

//Set Parameters for s3
let params = {
  Bucket: "< bucket Name >",
  Body: fs.createReadStream("< filePath >"),
  Key: "example.jpeg", //The object key (or key name) uniquely identifies the object in an Amazon S3
};

//Upload File On S3
s3.putObject(params, function (err, data) {
  if (err) {
    console.error("Error", err.message);
    throw err;
  } else {
    //let fileUrl = "https://" + < bucket > + ".s3." + < region > + ".amazonaws.com/" + newPath
    console.log("Success", data);
  }
});

/* ---------------------------------------------- */

/* ---------------------------------------------- */

// Private bucket
const express = require('express');
const fs = require('fs');
const AWS = require('aws-sdk');
const formidable = require('formidable'); // formidable : A Node.js module for parsing form data, especially file uploads.
const AmazonS3URI = require('amazon-s3-uri');
require('dotenv').config();
const app = express();

// API Endpoint for uploading file
app.post('/upload', async (req, res) => {
    try {
        const form = formidable.IncomingForm();

        // Parsing
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(503).json({
                    status: false,
                    message: 'There was an error parsing the files.',
                    error: err,
                });
            }

            // Check if multiple files or a single file
            if (!files.myFile.length) {
                //Single file
                const file = files.myFile;
                let fileName = file.name;
                let tempPath = file.path;

                /* upload file to S3 */

                //S3 Configuration

                //NOTE :  The SDK automatically detects AWS credentials set as variables in your environment and uses them for SDK requests. Doc : https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html

                const s3 = new AWS.S3({
                    region: process.env.AWS_REGION, //Optional
                });

                //Set Parameters for s3
                let params = {
                    //accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    //secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Body: fs.createReadStream(tempPath),
                    Key: fileName,
                };

                await s3.putObject(params, function (err, data) {
                    if (err) {
                        return res.status(503).json({
                            status: false,
                            error: err,
                            message: 'Something Wrong.',
                        });
                    } else {
                        //let fileUrl = "https://" + process.env.AWS_S3_BUCKET_NAME + ".s3." + process.env.AWS_REGION + ".amazonaws.com/" + fileName
                        return res.status(200).json({
                            status: true,
                            data: data,
                            message: 'File Successfully Uploaded.',
                        });
                    }
                });
            } else {
                //Multiple
            }
        });
    } catch (e) {
        return res.status(503).json({
            status: false,
            message: e.message
        });
    }
});

/* ---------------------------------------------- */

/* ---------------------------------------------- */
// Generate Pre Signed Url

const express = require('express');
const fs = require('fs');
const AWS = require('aws-sdk');
const formidable = require('formidable'); // formidable : A Node.js module for parsing form data, especially file uploads.
const AmazonS3URI = require('amazon-s3-uri');
require('dotenv').config();
const app = express();

// API Endpoint for generating pre signed url of private file 
app.post('/generatePreSignedURL', async (req, res) => {
    try {
        //S3 Configuration

        //NOTE :  The SDK automatically detects AWS credentials set as variables in your environment and uses them for SDK requests. Doc : https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html

        const s3 = new AWS.S3({
            //accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            //secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_S3_REGION,
        });

        let uri = req.body?.uri;

        if (!uri) {
            return res
                .status(400)
                .json({
                    status: false,
                    message: 'Invalid request, Url not found in request.',
                });
        }

        try {
            const { region, bucket, key } = AmazonS3URI(uri);

            let options = {
                Bucket: bucket,
                Key: key,
                Expires: 1 * 60 * 60, // 1 hour
            };

            await s3.getSignedUrl('getObject', options, (err, url) => {
                if (err) {
                    return res.status(503).json({
                        status: false,
                        error: err,
                        message: 'Something Wrong.',
                    });
                } else {
                    return res.status(200).json({
                        status: true,
                        data: url,
                        message: 'Success.',
                    });
                }
            });

        } catch (err) {
            return res.status(503).json({
                status: false,
                error: err,
                message: `${uri} is not a valid S3 uri`,
            });
        }
    } catch (e) {
        return res.status(503).json({
            status: false,
            message: e.message
        });
    }
});

/* ---------------------------------------------- */



