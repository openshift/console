const fs = require('fs');
const path = require('path');
const { gettextToI18next } = require('i18next-conv');
const minimist = require('minimist');

function save(target) {
  return (result) => {
    fs.writeFileSync(target, JSON.stringify(JSON.parse(result), null, 2));
  };
}

function processFile(fileName, language) {
  if (fileName.includes('.DS_Store')) {
    return;
  }
  let newFilePath;
  const [packageDir, newFileName] = path.basename(fileName, '.po').split('__');
  if (packageDir !== 'public') {
    if (!fs.existsSync(path.join(__dirname, `./../packages/${packageDir}/locales/${language}`))) {
      fs.mkdirSync(path.join(__dirname, `./../packages/${packageDir}/locales/${language}`), {
        recursive: true,
      });
    }
    newFilePath = path.join(
      __dirname,
      `./../packages/${packageDir}/locales/${language}/${newFileName}.json`,
    );
    console.log(`Saving packages/${packageDir}/locales/${language}/${newFileName}.json`);
  } else {
    if (!fs.existsSync(path.join(__dirname, `../public/locales/${language}/`))) {
      fs.mkdirSync(path.join(__dirname, `../public/locales/${language}/`), { recursive: true });
    }
    newFilePath = path.join(__dirname, `../public/locales/${language}/${newFileName}.json`);
    console.log(`Saving public/locales/${language}/${newFileName}.json`);
  }
  gettextToI18next(language, fs.readFileSync(fileName))
    .then(save(newFilePath))
    .catch((e) => console.error(fileName, e));
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
  console.log(
    "-h: help\n-l: language (i.e. 'ja')\n-d: directory to convert files in (i.e. './new-pos')",
  );
} else if (args.directory && args.language) {
  processDirectory(args.directory, args.language);
}
