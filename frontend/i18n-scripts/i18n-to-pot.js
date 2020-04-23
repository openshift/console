const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { i18nextToPot } = require('i18next-conv');
const common = require('./common.js');

function save(target) {
  return (result) => {
    fs.writeFileSync(target, result);
  };
}

function removeValues(i18nFile, filePath) {
  const file = require(i18nFile);

  const updatedFile = {};

  const keys = Object.keys(file);

  for (let i = 0; i < keys.length; i++) {
    updatedFile[keys[i]] = '';
  }

  const tmpFile = fs.openSync(filePath, 'w');

  fs.writeFile(tmpFile, JSON.stringify(updatedFile, null, 2), function writeJSON(e) {
    if (e) {
      // eslint-disable-next-line no-console
      return console.error(e);
    }
  });
}

function processFile(fileName, package, language) {
  /* eslint-disable no-undef, no-console */
  if (package) {
    const i18nFile = path.join(__dirname, `./../packages/${package}/locales/en/${fileName}.json`);

    fs.mkdirSync(path.join(__dirname, `./../packages/${package}/locales/tmp`), {
      recursive: true,
    });

    const tmpFile = path.join(__dirname, `./../packages/${package}/locales/tmp/${fileName}.json`);

    removeValues(i18nFile, tmpFile);

    fs.mkdirSync(path.join(__dirname, `./../packages/${package}/locales/pots`), {
      recursive: true,
    });
    i18nextToPot(language, fs.readFileSync(tmpFile)).then(
      save(
        path.join(
          __dirname,
          `./../packages/${package}/locales/pots/${path.basename(fileName)}.pot`,
        ),
      ),
    );
    common.deleteFile(tmpFile);
    console.log(`Processed ${fileName}`);
  } else {
    const i18nFile = path.join(__dirname, `./../public/locales/en/${fileName}.json`);

    fs.mkdirSync(path.join(__dirname, './../public/locales/tmp'), { recursive: true });

    const tmpFile = path.join(__dirname, `./../public/locales/tmp/${fileName}.json`);

    removeValues(i18nFile, tmpFile);

    fs.mkdirSync(path.join(__dirname, './../public/locales/pots'), { recursive: true });
    i18nextToPot(language, fs.readFileSync(tmpFile)).then(
      save(path.join(__dirname, `./../public/locales/pots/${path.basename(fileName)}.pot`)),
    );

    common.deleteFile(tmpFile);
    console.log(`Processed ${fileName}`);
  }
  /* eslint-enable */
}

const options = {
  string: ['language', 'package', 'file'],
  boolean: ['help'],
  array: ['files'],
  alias: {
    h: 'help',
    p: 'package',
    f: 'files',
    l: 'language',
  },
  default: {
    files: [],
    package: undefined,
    language: 'ja',
  },
};

const args = minimist(process.argv.slice(2), options);

if (args.help) {
  // eslint-disable-next-line no-console
  return console.log(
    "-h: help\n-l: language (defaults to 'ja')\n-p: package (i.e. 'dev-console'; defaults to undefined)\n-f: file name to convert (i.e. 'nav')",
  );
}

if (args.files) {
  if (Array.isArray(args.files)) {
    for (let i = 0; i < args.files.length; i++) {
      processFile(args.files[i], args.package, args.language);
    }
  } else {
    processFile(args.files, args.package, args.language);
  }
}
