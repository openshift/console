import { Buffer } from 'buffer';
import { encode, decode } from 'ini';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ClusterOperatorModel } from '@console/internal/models';
import { ClusterOperator } from '@console/internal/module/k8s';
import {
  DELAY_BEFORE_POLLING_RETRY,
  MAX_RETRY_ATTEMPTS_CO,
  VSPHERE_CREDS_SECRET_NAME,
  VSPHERE_CREDS_SECRET_NAMESPACE,
} from '../constants';
import { getCondition, OperatorStateType } from '../resources';
import { ConnectionFormContextValues } from './types';

export const parseKeyValue = (config: string, delimiter = '='): { [key: string]: string } => {
  const lines = config.split('\n');

  const result: { [key: string]: string } = {};
  lines.forEach((line) => {
    const idx = line.indexOf(delimiter);
    if (idx > 0) {
      const key = line.substring(0, idx).trim();
      let value = line.substring(idx + 1).trim();

      if (value.charAt(0) === '"') value = value.substring(1);
      if (value.charAt(value.length - 1) === '"') value = value.substring(0, value.length - 1);
      result[key] = value;
    }
  });

  return result;
};

export const encodeBase64 = (data: string) => Buffer.from(data).toString('base64');
export const decodeBase64 = (data: string) => Buffer.from(data, 'base64').toString('ascii');

export const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const mergeCloudProviderConfig = (
  existingIni: string,
  { vcenter, datacenter, defaultdatastore, folder }: ConnectionFormContextValues,
): string => {
  const configIni = decode(existingIni);

  configIni.Global = configIni.Global || {};
  configIni.Global['secret-name'] = VSPHERE_CREDS_SECRET_NAME;
  configIni.Global['secret-namespace'] = VSPHERE_CREDS_SECRET_NAMESPACE;
  configIni.Global['insecure-flag'] = '1' /* string */;

  // TODO: figure-out how to use quotes here
  configIni.Workspace = configIni.Workspace || {};
  configIni.Workspace.server = vcenter;
  configIni.Workspace.datacenter = datacenter;
  configIni.Workspace['default-datastore'] = defaultdatastore;
  configIni.Workspace.folder = folder;

  Object.keys(configIni).forEach((k: string) => {
    if (k.startsWith('VirtualCenter')) {
      delete configIni[k];
    }
  });
  configIni[`VirtualCenter "${vcenter}"`] = {
    datacenters: datacenter,
  };

  const ini = encode(configIni);

  // correct the encoded string to the expected one
  const result = ini
    .split('\n')
    .map((line: string) => {
      if (line.startsWith('[VirtualCenter "')) {
        // We do not want to have the value escaped ("safe")
        return `[VirtualCenter "${vcenter}"]`;
      }
      return line;
    })
    .join('\n');

  return result;
};

export const waitForClusterOperator = async (
  name: string,
  abortSignal: React.MutableRefObject<boolean>,
  expectedState: OperatorStateType = {
    /* An undefined value would mean: I don't care */
    progressing: 'False',
    degraded: 'False',
    available: 'True',
  },
  maxPollingAttempts: number = MAX_RETRY_ATTEMPTS_CO,
): Promise<boolean> => {
  for (let counter = 0; counter < maxPollingAttempts; counter++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const operator = await k8sGet<ClusterOperator>({ model: ClusterOperatorModel, name });
      if (
        (!expectedState.progressing ||
          getCondition(operator, 'Progressing')?.status === expectedState.progressing) &&
        (!expectedState.degraded ||
          getCondition(operator, 'Degraded')?.status === expectedState.degraded) &&
        (!expectedState.available ||
          getCondition(operator, 'Available')?.status === expectedState.available)
      ) {
        // all good
        return true;
      }
    } catch (e) {
      // do not report, keep trying
    }

    if (abortSignal.current) {
      return false;
    }

    // eslint-disable-next-line no-await-in-loop
    await delay(DELAY_BEFORE_POLLING_RETRY);
  }

  return false;
};
