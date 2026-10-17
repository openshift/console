import * as fs from 'fs';
import * as path from 'path';
import { i18nextToPo } from 'i18next-conv';
import * as minimist from 'minimist';
import { deleteFile } from './common';

const save = (target: string) => (result: string) => {
  fs.writeFileSync(target, result);
};

const removeValues = (i18nFile: string, filePath: string) => {
  const file = require(i18nFile);

  const updatedFile: { [key: string]: string } = {};

  for (const key of Object.keys(file)) {
    updatedFile[key] = '';
  }

  const tmpFile = fs.openSync(filePath, 'w');

  fs.writeFileSync(tmpFile, JSON.stringify(updatedFile, null, 2));
};

const consolidateWithExistingTranslations = (
  filePath: string,
  fileName: string,
  language: string,
  packageDir?: string,
) => {
  let existingTranslationsPath: string;
  const englishFile = require(filePath);
  const englishKeys = Object.keys(englishFile);
  if (packageDir) {
    existingTranslationsPath = `./../packages/${packageDir}/locales/${language}/${fileName}.json`;
  } else {
    existingTranslationsPath = `./../public/locales/${language}/${fileName}.json`;
  }
  if (fs.existsSync(path.join(__dirname, existingTranslationsPath))) {
    const existingTranslationsFile = require(path.join(__dirname, existingTranslationsPath));
    const existingKeys = Object.keys(existingTranslationsFile);
    const matchingKeys = englishKeys.filter((k) => existingKeys.indexOf(k) > -1);

    for (const key of matchingKeys) {
      englishFile[key] = existingTranslationsFile[key];
    }

    fs.writeFileSync(filePath, JSON.stringify(englishFile, null, 2));
  }
};

const processFile = (fileName: string, packageDir: string | undefined, language: string) => {
  let tmpFile: string | undefined;
  if (packageDir) {
    const i18nFile = path.join(
      __dirname,
      `./../packages/${packageDir}/locales/en/${fileName}.json`,
    );

    try {
      if (fs.existsSync(i18nFile)) {
        fs.mkdirSync(path.join(__dirname, `./../packages/${packageDir}/locales/tmp`), {
          recursive: true,
        });

        tmpFile = path.join(__dirname, `./../packages/${packageDir}/locales/tmp/${fileName}.json`);

        removeValues(i18nFile, tmpFile);
        consolidateWithExistingTranslations(tmpFile, fileName, language, packageDir);

        fs.mkdirSync(path.join(__dirname, `./../po-files/${language}`), {
          recursive: true,
        });
        i18nextToPo(language, fs.readFileSync(tmpFile), {
          language,
          foldLength: 0,
          ctxSeparator: '~',
        })
          .then(
            save(
              path.join(
                __dirname,
                `./../po-files/${language}/${packageDir.split('/')[0]}__${path.basename(
                  fileName,
                )}.po`,
              ),
            ),
          )
          .catch((e) => console.error(fileName, e));
      }
    } catch (err) {
      console.error(`Failed to processFile ${fileName} in ${packageDir}:`, err);
    }
  } else {
    const i18nFile = path.join(__dirname, `./../public/locales/en/${fileName}.json`);

    try {
      if (fs.existsSync(i18nFile)) {
        fs.mkdirSync(path.join(__dirname, './../public/locales/tmp'), { recursive: true });

        tmpFile = path.join(__dirname, `./../public/locales/tmp/${fileName}.json`);

        removeValues(i18nFile, tmpFile);
        consolidateWithExistingTranslations(tmpFile, fileName, language);

        fs.mkdirSync(path.join(__dirname, `./../po-files/${language}`), {
          recursive: true,
        });
        i18nextToPo(language, fs.readFileSync(tmpFile), {
          language,
          foldLength: 0,
          ctxSeparator: '~',
        })
          .then(
            save(
              path.join(
                __dirname,
                `./../po-files/${language}/public__${path.basename(fileName)}.po`,
              ),
            ),
          )
          .catch((e: unknown) => console.error(fileName, e));
      }
    } catch (err) {
      console.error(`Failed to processFile ${fileName}:`, err);
    }
  }
  if (tmpFile) {
    deleteFile(tmpFile);
  }
  console.log(`Processed ${fileName}`);
};

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
  },
};

const args = minimist(process.argv.slice(2), options);

if (args.help) {
  console.log(
    "-h: help\n-l: language (i.e. 'ja')\n-p: package (i.e. 'dev-console'; defaults to undefined)\n-f: file name to convert (i.e. 'nav')",
  );
} else if (args.files && args.language) {
  if (Array.isArray(args.files)) {
    for (const file of args.files) {
      processFile(file, args.package, args.language);
    }
  } else {
    processFile(args.files, args.package, args.language);
  }
}
