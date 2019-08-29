/*  eslint-disable no-console */
import { removeSync, emptyDirSync, ensureDirSync } from 'fs-extra';
import * as process from 'process';
import { generateAndMapTypes } from './generators/configured-generator';
import { getKubevirtConfig, getOpenshiftConfig, SRC_DIR, TEMP_DIR } from './config';

type Options = {
  openshift: boolean,
  kubevirt: boolean,
}

const getOptions = (): Options => {
  const argsSet = new Set(process.argv);
  const options = {
    openshift: false,
    kubevirt: false,
  };

  if(argsSet.has('all')){
    Object.keys(options).forEach( key => {
      options[key] = true;
    });
  }else {
    options.openshift = argsSet.has('openshift');
    options.kubevirt = argsSet.has('kubevirt');
  }
  return options;
};

const generate = async (options: Options) => {
  let exitCode = 0;
  try {
    emptyDirSync(TEMP_DIR);
    ensureDirSync(SRC_DIR);

    if(options.openshift){
      await generateAndMapTypes(getOpenshiftConfig());
    }
    if(options.kubevirt){
      await generateAndMapTypes(getKubevirtConfig());
    }

  } catch (e) {
    console.error('ERROR: kube-types package in inconsistent state (please revert the changes)');
    console.error(e);
    exitCode = 1;
  } finally {
    removeSync(TEMP_DIR);
  }
  return exitCode;
};

generate(getOptions()).then( exitCode => process.exit(exitCode));
