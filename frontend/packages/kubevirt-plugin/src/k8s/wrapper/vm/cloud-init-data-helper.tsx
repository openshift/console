import * as _ from 'lodash';
import { getRandomChars } from '@console/shared';
import { safeLoad, safeDump } from 'js-yaml';
import { V1CloudInitNoCloudSource } from '../../../types/vm/disk/V1CloudInitNoCloudSource';

const safeAtob = (value: string) => {
  try {
    return atob(value);
  } catch (ignored) {
    return '';
  }
};

export enum CloudInitDataFormKeys {
  NAME = 'name',
  HOSTNAME = 'hostname',
  SSH_AUTHORIZED_KEYS = 'ssh_authorized_keys',
  PASSWORD = 'password',
}
export const CLOUD_CONFIG_HEADER = '#cloud-config';

export const formAllowedKeys = new Set([
  CloudInitDataFormKeys.NAME,
  CloudInitDataFormKeys.HOSTNAME,
  CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS,
]);

export const generateCloudInitPassword = () =>
  getRandomChars(12)
    .match(/.{1,4}/g)
    .join('-');

export class CloudInitDataHelper {
  static getUserData = (cloudInitNoCloud?: V1CloudInitNoCloudSource) => {
    const isBase64 = _.has(cloudInitNoCloud, 'userDataBase64');
    const userData = isBase64
      ? safeAtob(cloudInitNoCloud && cloudInitNoCloud.userDataBase64)
      : cloudInitNoCloud && cloudInitNoCloud.userData;
    return [userData, isBase64] as [string, boolean];
  };

  static toCloudInitNoCloudSource = (
    userData: string,
    isBase64: boolean,
  ): V1CloudInitNoCloudSource => {
    if (isBase64) {
      return { userDataBase64: btoa(userData) };
    }
    return { userData };
  };

  private header: string;

  private base64: boolean;

  private cloudConfigData: any = null;

  private otherFormatData: any = null;

  constructor(cloudInitNoCloud?: V1CloudInitNoCloudSource) {
    const [userData, isBase64] = CloudInitDataHelper.getUserData(cloudInitNoCloud);
    this.base64 = isBase64;

    const firstLineSepIndex = userData ? userData.indexOf('\n') : -1;
    const header = firstLineSepIndex === -1 ? undefined : userData.substring(0, firstLineSepIndex);
    const rest = firstLineSepIndex === -1 ? undefined : userData.substring(firstLineSepIndex + 1);

    if (_.trimEnd(header) === CLOUD_CONFIG_HEADER) {
      try {
        this.cloudConfigData = safeLoad(rest);
        this.header = header;
      } catch (e) {
        this.otherFormatData = userData;
      }
    } else {
      this.otherFormatData = userData;
    }
  }

  isEmpty = () => !this.otherFormatData && _.isEmpty(this.cloudConfigData);

  includesOnlyFormValues = () =>
    this.cloudConfigData
      ? Object.keys(this.cloudConfigData).every((key) => formAllowedKeys.has(key as any))
      : !this.otherFormatData;

  areAllFormValuesEmpty = () =>
    this.isEmpty() ||
    (this.includesOnlyFormValues() &&
      !Object.keys(this.cloudConfigData).find(
        (key) => this.has(key) && key !== CloudInitDataFormKeys.NAME,
      ));

  getUserData = () => {
    if (this.cloudConfigData) {
      const resultData = safeDump(this.cloudConfigData);
      return this.header ? `${this.header}\n${resultData}` : resultData;
    }
    return this.otherFormatData;
  };

  get = (key: string) => this.cloudConfigData && this.cloudConfigData[key];

  has = (key: string) => !!this.get(key);

  set = (key: string, value: string) => {
    if (key && !this.otherFormatData) {
      if (!this.cloudConfigData) {
        this.cloudConfigData = {};
      }
      if (value === undefined) {
        delete this.cloudConfigData[key];
      } else {
        this.cloudConfigData[key] = value;
      }
    }
  };

  makeFormCompliant = () => {
    this.header = CLOUD_CONFIG_HEADER;
    this.otherFormatData = undefined;
    if (!this.cloudConfigData) {
      this.cloudConfigData = {};
    }
    Object.keys(this.cloudConfigData).forEach((key) => {
      if (!formAllowedKeys.has(key as any)) {
        delete this.cloudConfigData[key];
      }
    });
    if (!this.cloudConfigData[CloudInitDataFormKeys.NAME]) {
      this.cloudConfigData[CloudInitDataFormKeys.NAME] = 'default'; // root account might not be enabled
    }
  };

  asCloudInitNoCloudSource = () =>
    CloudInitDataHelper.toCloudInitNoCloudSource(this.getUserData(), this.base64);
}
