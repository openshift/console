/*  eslint-disable no-console */
import { emptyDirSync, moveSync } from 'fs-extra';
import * as fs from 'fs';
import { download } from '../utils';
import { openapiGenerator } from './openapi-generator';
import { buildSrcPath, buildTempPath, Config } from '../config';

const GENERATED = 'generated';

export type FileType = {
  content: string;
  filename: string;
};

const checkFileDoesNotExist = (filename) => {
  if (fs.existsSync(filename)) {
    throw new Error(
      `Not unique filename (${filename})! (Maybe wrong package name mapping/elimination?)`,
    );
  }
};

export const generateTypes = async ({
  config: { name, url },
  processAPIObject,
  processFile,
}: {
  config: Config;
  processAPIObject?: Function;
  processFile?: (a: FileType) => FileType;
}) => {
  const openAPIObject: any = await download(url);
  const generateFrom = processAPIObject ? processAPIObject(openAPIObject) : openAPIObject;

  const apiFilename = buildTempPath(name, `${name}-types.json`);
  const generatedDir = buildTempPath(name, GENERATED);

  emptyDirSync(generatedDir);
  fs.writeFileSync(apiFilename, JSON.stringify(generateFrom));
  await openapiGenerator(apiFilename, generatedDir);

  // copy files to src directory
  emptyDirSync(buildSrcPath(name));

  fs.readdirSync(buildTempPath(name, GENERATED, 'models')).forEach((filename) => {
    const relativeTmpPathToFile = buildTempPath(name, GENERATED, 'models', filename);
    if (processFile) {
      const readContent = fs.readFileSync(relativeTmpPathToFile, 'utf8');
      const { content: resultContent, filename: resultFilename } = processFile({
        content: readContent,
        filename,
      });

      const resultFullFilename = buildSrcPath(name, resultFilename);
      checkFileDoesNotExist(resultFullFilename);
      fs.writeFileSync(resultFullFilename, resultContent);
    } else {
      const resultFullFilename = buildSrcPath(name, filename);
      checkFileDoesNotExist(resultFullFilename);
      moveSync(relativeTmpPathToFile, resultFullFilename);
    }
  });
};
