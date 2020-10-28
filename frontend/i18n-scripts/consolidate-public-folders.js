const fs = require('fs');
const path = require('path');
const common = require('./common.js');

const public = path.join(__dirname, './../public/locales/');
const packages = path.join(__dirname, './../packages');

const publicFileNames = {};

function processFile(fileName) {
  const language = path.basename(path.dirname(fileName));
  if (publicFileNames[language].includes(path.basename(fileName))) {
    console.log(`Merging ${fileName} with matching public namespace.`);
    const file = require(fileName);
    const publicFile = path.join(
      __dirname,
      `./../public/locales/${language}/${path.basename(fileName)}`,
    );
    const keys = Object.keys(file);

    const data = fs.readFileSync(publicFile);

    const json = JSON.parse(data);

    for (let i = 0; i < keys.length; i++) {
      if (!json.hasOwnProperty(keys[i])) {
        json[keys[i]] = file[keys[i]];
      } else {
        console.log(
          `Conflict: Key "${keys[i]}" in ${publicFile} already exists. Skipping merge for "${keys[i]}."`,
        );
      }
    }

    fs.writeFileSync(publicFile, JSON.stringify(json, null, 2));

    common.deleteFile(fileName);
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
