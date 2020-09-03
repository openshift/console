const fs = require('fs');
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { gettextToI18next } = require('i18next-conv');

// eslint-disable-next-line no-undef
const directory = path.join(__dirname, '../frontend/locales/pos');

function save(target) {
  return (result) => {
    writeFileSync(target, JSON.stringify(JSON.parse(result), null, 2));
  };
}

function processFile(fileName) {
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

  gettextToI18next(language, readFileSync(fileName)).then(
    save(`../frontend/locales/${language}/${newFileName[newFileName.length - 1]}.json`),
  );
}

(async () => {
  try {
    if (fs.existsSync(directory)) {
      // eslint-disable-next-line no-console
      const files = await fs.promises.readdir(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        processFile(filePath);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error(`Please save your .po files under ${directory} and try again.`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
})();
