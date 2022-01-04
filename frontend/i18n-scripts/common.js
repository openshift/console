const fs = require('fs');
const path = require('path');

module.exports = {
  isDirectory(filePath) {
    try {
      const stat = fs.lstatSync(filePath);
      return stat.isDirectory();
    } catch (e) {
      // lstatSync throws an error if path doesn't exist
      return false;
    }
  },
  findLocalesFolder(directory, argFunction, packageDir) {
    const localesFolder = path.join(directory, 'locales');
    if (fs.existsSync(localesFolder)) {
      return argFunction(localesFolder, packageDir);
    }
    return undefined;
  },
  parseFolder(directory, argFunction, packageDir) {
    (async () => {
      try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
          const filePath = path.join(directory, file);
          argFunction(filePath, packageDir);
        }
      } catch (e) {
        console.error(`Failed to parseFolder ${directory}:`, e);
      }
    })();
  },
  deleteFile(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error(`Failed to delete file ${filePath}:`, e);
    }
  },
};
