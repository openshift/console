// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const fs = require('fs');
const path = require('path');
const wp = require('@cypress/webpack-preprocessor');
const util = require('../reporters/utils/parallel-thread-logger');

const resultsPath = path.join(process.cwd(), 'runner-results');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: { happyPackMode: true, transpileOnly: true },
          },
        ],
      },
    },
  };
  // `on` is used to hook into various events Cypress emits
  on('task', {
    log(message) {
      console.log(message);
      util.log(`\n\t${message}`);
      return null;
    },
    logError(message) {
      console.error(message);
      return null;
    },
    logTable(data) {
      console.table(data);
      return null;
    },
    readFileIfExists(filename) {
      if (fs.existsSync(filename)) {
        return fs.readFileSync(filename, 'utf8');
      }
      return null;
    },
  });
  on('after:spec', (spec, results) => {
    if (results) {
      util.logSpecResult(results);
    }

    if (results && results.screenshots.length) {
      util.logScreenshotURL(results.screenshots);
    }

    if (results && results.video) {
      util.logVideoURL(results.video);
    }

    util.log(`\n\n${'-'.repeat(100)}`);

    function calculateDuration(start, end) {
      // end = end || new Date();
      const duration = new Date(end).getTime() - new Date(start).getTime();
      return duration;
    }

    function cleanStatistics() {
      return {
        ...results.stats,
        duration: calculateDuration(results.stats.startedAt, results.stats.endedAt),
        file: results.spec.name,
      };
    }

    function writeFile(statistics) {
      // replace forward and backward slash with _ to generate filename
      const fileName = statistics.file.replace(/\\|\//g, '_');
      if (!fs.existsSync(resultsPath)) {
        fs.mkdirSync(resultsPath);
      }
      const specResultPath = path.join(resultsPath, `${fileName}.json`);
      fs.writeFileSync(specResultPath, JSON.stringify(statistics, null, 2));
    }

    writeFile(cleanStatistics());
  });
  on('after:screenshot', (details) => {
    // Prepend "1_", "2_", etc. to screenshot filenames because they are sorted alphanumerically in CI's artifacts dir
    const pathObj = path.parse(details.path);

    fs.readdir(pathObj.dir, (error, files) => {
      const newPath = `${pathObj.dir}${path.sep}${files.length}_${pathObj.base}`;
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line consistent-return
        fs.rename(details.path, newPath, (err) => {
          if (err) return reject(err);
          // because we renamed and moved the image, resolve with the new path
          // so it is accurate in the test results
          resolve({ path: newPath });
        });
      });
    });
  });
  on('file:preprocessor', wp(options));
  // `config` is the resolved Cypress config
  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(
    process.env.BRIDGE_BASE_PATH || '/'
  ).replace(/\/$/, '')}`;
  config.env.BRIDGE_HTPASSWD_IDP = process.env.BRIDGE_HTPASSWD_IDP;
  config.env.BRIDGE_HTPASSWD_USERNAME = process.env.BRIDGE_HTPASSWD_USERNAME;
  config.env.BRIDGE_HTPASSWD_PASSWORD = process.env.BRIDGE_HTPASSWD_PASSWORD;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  config.env.OAUTH_BASE_ADDRESS = process.env.OAUTH_BASE_ADDRESS;
  config.env.OPENSHIFT_CI = process.env.OPENSHIFT_CI;
  return config;
};
