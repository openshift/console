import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { DeviceType } from '../constants';
import { V1Disk } from './api';
import { V1NetworkInterface } from './vm';

export type BootableDeviceType = {
  type: DeviceType;
  typeLabel: string;
  value: V1Disk | V1NetworkInterface;
};

export type IDEntity = {
  id: number;
};

export type OperatingSystemRecord = {
  id: string;
  name: string;
  baseImageName?: string;
  baseImageNamespace?: string;
  baseImageRecomendedSize?: any;
};

export type OperationSystemField = {
  id: string;
  name: string;
  baseImageFoundInCluster: ImmutableMap<string, PersistentVolumeClaimKind>;
  message: string;
  longMessage?: string | React.ReactElement<any, any>;
  checkboxDescription: string;
  pvcName?: string;
  pvcNamespace?: string;
};
