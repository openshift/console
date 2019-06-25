/*  eslint-disable no-console */
import * as process from 'process';
import { spawn } from 'child_process';

export const openapiGenerator = async (input, outputFolder) => {
  return new Promise((resolve, reject) => {
    const genCommand = 'node_modules/.bin/openapi-generator';
    const genArgs = [
      'generate',
      '-Dmodels ',
      '-DsupportingFiles ', // index.js
      '--generator-name',
      'typescript-fetch',
      '--input-spec',
      input,
      '--output',
      outputFolder,
    ];

    console.log(genCommand, genArgs.join(' '));

    const genProc = spawn(genCommand, genArgs, { env: process.env });
    genProc.stdout.pipe(process.stdout);
    genProc.stderr.on('data', (errData) => console.error(String(errData)));

    genProc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        console.error(`openapi-generator exited with code ${code}`);
        reject(code);
      }
    });
  });
};
