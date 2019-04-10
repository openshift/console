#!/usr/bin/env node

const path = require('path');
const readPkgUp = require('read-pkg-up');
const spawn = require('cross-spawn');
const utils = require('../src/utils');

const scriptName = path.basename(process.argv[1]);
const callerDir = process.cwd();

const { pkg: rootPkg = {}, path: rootPkgPath } = readPkgUp.sync({ cwd: path.dirname(callerDir) });

if (rootPkg.name !== '@console/root') {
  console.error(
    `The script ${scriptName} was called on a package outside the Console monorepo structure.`
  );
  process.exit(1);
}

const rootDir = path.dirname(rootPkgPath);
const callerRelativePath = path.relative(rootDir, callerDir);

utils.handleSpawnResult(
  spawn.sync('yarn', ['test', callerRelativePath], { stdio: 'inherit', cwd: rootDir })
);
