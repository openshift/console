import { Buffer } from 'buffer';
import { encode, decode } from 'ini';
import { VSPHERE_CREDS_SECRET_NAME, VSPHERE_CREDS_SECRET_NAMESPACE } from '../constants';
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

export const mergeCloudProviderConfig = (
  existingIni: string,
  { vcenter, datacenter, defaultDatastore: defaultdatastore, folder }: ConnectionFormContextValues,
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
