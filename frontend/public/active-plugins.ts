/* eslint-disable no-undef */
import { ActivePlugin } from '@console/plugin-sdk';
import AppPlugin from '@console/app/src/plugin';
import CephPlugin from '@console/ceph-storage-plugin/src/plugin';
import DevConsolePlugin from '@console/dev-console/src/plugin';
import KnativePlugin from '@console/knative-plugin/src/plugin';
import KubeVirtPlugin from '@console/kubevirt-plugin/src/plugin';
import Metal3Plugin from '@console/metal3-plugin/src/plugin';
import NoobaStoragePlugin from '@console/noobaa-storage-plugin/src/plugin';

// Yes, we can dynamically code generate the `require()`s for these extensions.
// But then debugging webpack is a pain. Maybe there's some middleground...
export const activePlugins = (process.env.NODE_ENV !== 'test')
  ? [
    { name: '@console/app', extensions: AppPlugin },
    { name: '@console/ceph-storage-plugin', extensions: CephPlugin },
    { name: '@console/dev-console', extensions: DevConsolePlugin },
    { name: '@console/knative-plugin', extensions: KnativePlugin },
    { name: '@console/kubevirt-plugin', extensions: KubeVirtPlugin },
    { name: '@console/metal3-plugin', extensions: Metal3Plugin },
    { name: '@console/noobaa-storage-plugin', extensions: NoobaStoragePlugin },
  ] as ActivePlugin[]
  : [];
