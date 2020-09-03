const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-undef
const directory = path.join(__dirname, '../frontend/locales/en');

function updateFile(fileName) {
  const file = require(fileName);
  const updatedFile = {};

  const keys = Object.keys(file);

  for (let i = 0; i < keys.length; i++) {
    if (file[keys[i]] === '') {
      updatedFile[keys[i]] = keys[i];
    } else {
      updatedFile[keys[i]] = file[keys[i]];
    }
  }

  fs.writeFile(fileName, JSON.stringify(updatedFile, null, 2), function writeJSON(e) {
    if (e) {
      // eslint-disable-next-line no-console
      return console.error(e);
    }
  });
}

(async () => {
  try {
    const files = await fs.promises.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      updateFile(filePath);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
})();
