const fs = require('fs');
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { i18nextToPot } = require('i18next-conv');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function save(target) {
  return (result) => {
    writeFileSync(target, result);
  };
}

function processFile(fileName) {
  // eslint-disable-next-line no-undef
  fs.mkdirSync(path.join(__dirname, '../frontend/locales/pots'), { recursive: true });
  // eslint-disable-next-line no-undef
  i18nextToPot('ja', readFileSync(path.join(__dirname, `../frontend/locales/ja/${fileName}.json`)))
    // eslint-disable-next-line no-undef
    .then(save(path.join(__dirname, `../frontend/locales/pots/${fileName}.pot`)));
}

rl.question('What locale do you want to create a .pot file for? ', function(submittedFilePath) {
  processFile(submittedFilePath);
  rl.close();
});
