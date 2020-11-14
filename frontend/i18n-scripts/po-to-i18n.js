const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { gettextToI18next } = require('i18next-conv');

function save(target) {
  return (result) => {
    fs.writeFileSync(target, JSON.stringify(JSON.parse(result), null, 2));
  };
}

function processFile(fileName, language) {
  let newFilePath;
  const package =
    fileName.includes('_package=') && path.basename(fileName, '.po').split('_package=')[1];
  const newFileName = package
    ? path.basename(fileName, '.po').split('_package=')[0]
    : path.basename(fileName, '.po');
  if (package) {
    if (!fs.existsSync(path.join(__dirname, `./../packages/${package}/locales/${language}`))) {
      fs.mkdirSync(path.join(__dirname, `./../packages/${package}/locales/${language}`), {
        recursive: true,
      });
    }
    newFilePath = path.join(
      __dirname,
      `./../packages/${package}/locales/${language}/${newFileName}.json`,
    );
    console.log(`Saving packages/${package}/locales/${language}/${newFileName}.json`);
  } else {
    if (!fs.existsSync(path.join(__dirname, `../public/locales/${language}/`))) {
      fs.mkdirSync(path.join(__dirname, `../public/locales/${language}/`), { recursive: true });
    }
    newFilePath = path.join(__dirname, `../public/locales/${language}/${newFileName}.json`);
    console.log(`Saving public/locales/${language}/${newFileName}.json`);
  }
  gettextToI18next(language, fs.readFileSync(fileName)).then(save(newFilePath));
}

function processDirectory(directory, language) {
  if (fs.existsSync(directory)) {
    (async () => {
      try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
          const filePath = path.join(directory, file);
          processFile(filePath, language);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  } else {
    console.error('Directory does not exist.');
  }
}

const options = {
  string: ['language', 'directory'],
  boolean: ['help'],
  alias: {
    h: 'help',
    d: 'directory',
    l: 'language',
  },
};

const args = minimist(process.argv.slice(2), options);

if (args.help) {
  return console.log(
    "-h: help\n-l: language (i.e. 'ja')\n-d: directory to convert files in (i.e. './new-pos')",
  );
}

if (args.directory && args.language) {
  processDirectory(args.directory, args.language);
}
