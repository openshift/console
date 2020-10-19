const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-undef
module.exports = {
  isDirectory: function(filePath) {
    try {
      const stat = fs.lstatSync(filePath);
      return stat.isDirectory();
    } catch (e) {
      // lstatSync throws an error if path doesn't exist
      return false;
    }
  },
  findLocalesFolder: function(directory, argFunction, package) {
    const localesFolder = path.join(directory, 'locales');
    if (fs.existsSync(localesFolder)) {
      return argFunction(localesFolder, package);
    }
  },
  parseFolder: function(directory, argFunction, package) {
    (async () => {
      try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
          const filePath = path.join(directory, file);
          argFunction(filePath, package);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
  },
  deleteFile: function(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  },
};
