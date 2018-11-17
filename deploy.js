'use strict';

const S3Bucket = 'headchat.recime.io';
const CloudfrontDistributionId = 'E2621FHWZ4G621';

const CacheDuration = 60 * 60 * 24; // 24 hours

const path = require('path');

const aws = require('aws-sdk');
const fs = require('fs-extra');
const mime = require('mime-types');

aws.config.update({
  region: 'us-west-2',
  maxRetries: 10,
  retryDelayOptions: {
    base: 300
  }
});

const distDirectory = path.join(__dirname, 'dist');

const s3 = new aws.S3();
const cloudfront = new aws.CloudFront();

function getFiles() {
  function load(location) {
    return new Promise((resolve, reject) => {
      fs.readdir(location, (error, entries) => {
        if (error) {
          return reject(error);
        }

        const directories = [];
        const files = [];

        entries.forEach(entry => {
          const fullLocation = path.join(location, entry);
          const stat = fs.statSync(fullLocation);

          if (stat.isFile()) {
            files.push(fullLocation);
          } else if (stat.isDirectory()) {
            directories.push(fullLocation);
          }
        });

        const tasks = directories.map(load);

        return Promise.all(tasks)
          .then(results => {
            results.forEach(result => files.push(...result));
            return resolve(files);
          })
          .catch(reject);
      });
    });
  }

  return load(distDirectory);
}

function upload(files) {
  function put(file) {
    return new Promise((resolve, reject) => {
      const fileName = file.substring(distDirectory.length + 1);
      const mimeType = mime.lookup(fileName);

      const params = {
        Bucket: S3Bucket,
        ContentType: mimeType,
        CacheControl: `public,max-age=${CacheDuration}`,
        Key: fileName,
        Body: fs.createReadStream(file)
      };

      s3.upload(params, error => (error ? reject(error) : resolve()));
    });
  }

  const tasks = files.map(put);

  return Promise.all(tasks);
}

function invalidate() {
  function poll(id, resolve, reject) {
    setTimeout(() => {
      const params = {
        DistributionId: CloudfrontDistributionId,
        Id: id
      };

      cloudfront.getInvalidation(params, (error, result) => {
        if (error) {
          return reject(error);
        }

        if (result.Invalidation.Status === 'Completed') {
          return resolve();
        }

        poll(id, resolve, reject);
      });
    }, 3000);
  }

  return new Promise((resolve, reject) => {
    const params = {
      DistributionId: CloudfrontDistributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Items: [
            '/index.html',
            '/index.js',
            '/index.css',
            '/shim.js',
            '/launcher.html',
            '/launcher.html?mode=live',
            '/launcher.js',
            '/launcher.css',
            '/close.png',
            '/close-btn.png',
            '/reload-btn.png',
            '/favicon.ico',
            '/headchat-icon.png',
            '/header-icon.png'
          ]
        }
      }
    };

    params.InvalidationBatch.Paths.Quantity =
      params.InvalidationBatch.Paths.Items.length;

    cloudfront.createInvalidation(params, (error, result) => {
      if (error) {
        return reject(error);
      }

      return poll(result.Invalidation.Id, resolve, reject);
    });
  });
}

function remove(location) {
  return new Promise((resolve, reject) => {
    fs.remove(location, error => {
      return error ? reject(error) : resolve();
    });
  });
}

function deploy() {
  return getFiles()
    .then(files => upload(files))
    .then(() => remove(distDirectory))
    .then(() => invalidate());
}

module.exports = deploy;
