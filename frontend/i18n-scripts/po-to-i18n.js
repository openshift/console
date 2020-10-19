const fs = require('fs');
const path = require('path');
const common = require('./common.js');
const { gettextToI18next } = require('i18next-conv');

// eslint-disable-next-line no-undef
const public = path.join(__dirname, './../public/locales/pos');
// eslint-disable-next-line no-undef
const packages = path.join(__dirname, './../packages');

function save(target) {
  return (result) => {
    fs.writeFileSync(target, JSON.stringify(JSON.parse(result), null, 2));
  };
}

function processFile(fileName, package) {
  let language;
  let remainingPath;
  if (fileName.includes('zh_CN')) {
    language = 'zh';
    remainingPath = fileName.split(/-zh_CN\.po+/g)[0];
  }
  if (fileName.includes('ja_JP')) {
    language = 'ja';
    remainingPath = fileName.split(/-ja_JP\.po+/g)[0];
  }
  const newFileName = remainingPath.split('/');

  let newFilePath;
  if (package) {
    newFilePath = `./../packages/${package}/locales/${language}/${
      newFileName[newFileName.length - 1]
    }.json`;
  } else {
    newFilePath = `./../public/locales/${language}/${newFileName[newFileName.length - 1]}.json`;
  }
  gettextToI18next(language, fs.readFileSync(fileName)).then(save(newFilePath));
}

function findPOFiles(directory, package) {
  const poFolder = path.join(directory, 'pos');
  if (fs.existsSync(poFolder)) {
    common.parseFolder(poFolder, processFile, package);
  }
}

function processPackages(filePath) {
  if (common.isDirectory(filePath)) {
    common.findLocalesFolder(filePath, findPOFiles, path.basename(filePath));
  }
}

// eslint-disable-next-line no-console
console.log('You must save PO files to locales/pos in order to use this tool.');

if (fs.existsSync(public)) {
  common.parseFolder(public, processFile);
}
common.parseFolder(packages, processPackages);
