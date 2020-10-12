const fs = require('fs');
const path = require('path');
const common = require('./common.js');

// eslint-disable-next-line no-undef
const public = path.join(__dirname, './../public/locales/');
// eslint-disable-next-line no-undef
const packages = path.join(__dirname, './../packages');

const publicFileNames = {};

function processFile(fileName) {
  const language = path.basename(path.dirname(fileName));
  if (publicFileNames[language].includes(path.basename(fileName))) {
    const file = require(fileName);
    /* eslint-disable no-undef, no-console */
    const publicFile = path.join(
      __dirname,
      `./../public/locales/${language}/${path.basename(fileName)}`,
    );
    /* eslint-enable */
    const keys = Object.keys(file);

    fs.readFile(publicFile, function(e, data) {
      if (e) {
        // eslint-disable-next-line no-console
        return console.error(e);
      }

      const json = JSON.parse(data);
      let hasConflict = false;

      for (let i = 0; i < keys.length; i++) {
        if (!json.hasOwnProperty(keys[i])) {
          json[keys[i]] = file[keys[i]];
        } else {
          hasConflict = true;
          // eslint-disable-next-line no-console
          console.log(`Conflict: Key "${keys[i]}" in ${publicFile} already exists.`);
        }
      }

      fs.writeFile(publicFile, JSON.stringify(json, null, 2), function(err) {
        if (err) {
          // eslint-disable-next-line no-console
          return console.error(err);
        }
      });

      if (hasConflict) {
        // eslint-disable-next-line no-console
        console.log('Please edit conflicting keys and run yarn i18n again');
      } else {
        common.deleteFile(fileName);
      }
    });
  }
}

function processLocalesFolder(filePath) {
  if (path.basename(filePath) === 'en') {
    common.parseFolder(filePath, processFile);
  }
  if (path.basename(filePath) === 'zh') {
    common.parseFolder(filePath, processFile);
  }
  if (path.basename(filePath) === 'ja') {
    common.parseFolder(filePath, processFile);
  }
}

function iterateThroughLocalesFolder(filePath) {
  common.parseFolder(filePath, processLocalesFolder);
}

function processPackages(filePath) {
  if (common.isDirectory(filePath)) {
    common.findLocalesFolder(filePath, iterateThroughLocalesFolder);
  }
}

function logFiles(filePath) {
  const fileName = path.basename(filePath);
  const language = path.basename(path.dirname(filePath));
  if (publicFileNames[language]) {
    if (publicFileNames[language].includes(fileName)) {
      return;
    }
    publicFileNames[language].push(fileName);
  } else {
    publicFileNames[language] = [fileName];
  }
}

function processPublic(filePath) {
  if (path.basename(filePath) === 'en') {
    common.parseFolder(filePath, logFiles);
  }
  if (path.basename(filePath) === 'zh') {
    common.parseFolder(filePath, logFiles);
  }
  if (path.basename(filePath) === 'ja') {
    common.parseFolder(filePath, logFiles);
  }
}

common.parseFolder(public, processPublic);
common.parseFolder(packages, processPackages);
