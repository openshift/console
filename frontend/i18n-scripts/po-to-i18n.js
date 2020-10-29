const fs = require('fs');
const path = require('path');
const common = require('./common.js');
const { gettextToI18next } = require('i18next-conv');

const public = path.join(__dirname, './../public/locales/pos');
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
  } else {
    console.error(
      "You must provide a PO name that includes the language in the following format: 'ja_JP' or 'zh_CN'",
    );
    return;
  }
  const newFileName = remainingPath.split('/');

  let newFilePath;
  if (package) {
    if (!fs.existsSync(path.join(__dirname, `./../packages/${package}/locales/${language}`))) {
      fs.mkdirSync(path.join(__dirname, `./../packages/${package}/locales/${language}`), {
        recursive: true,
      });
    }
    newFilePath = path.join(
      __dirname,
      `./../packages/${package}/locales/${language}/${newFileName[newFileName.length - 1]}.json`,
    );
    console.log(
      `Saving packages/${package}/locales/${language}/${newFileName[newFileName.length - 1]}.json`,
    );
  } else {
    if (!fs.existsSync(path.join(__dirname, `../public/locales/${language}/`))) {
      fs.mkdirSync(path.join(__dirname, `../public/locales/${language}/`), { recursive: true });
    }
    newFilePath = path.join(
      __dirname,
      `../public/locales/${language}/${newFileName[newFileName.length - 1]}.json`,
    );
    console.log(`Saving public/locales/${language}/${newFileName[newFileName.length - 1]}.json`);
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

console.log('You must save PO files to locales/pos in order to use this tool.');

if (fs.existsSync(public)) {
  common.parseFolder(public, processFile);
}
common.parseFolder(packages, processPackages);
