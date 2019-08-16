/* eslint-disable no-undef */
import { ActivePlugin, ExtensionRegistry } from '@console/plugin-sdk';
import AppPlugin from '../packages/console-app/src/plugin';
import CephPlugin from '../packages/ceph-storage-plugin/src/plugin';
import DevConsolePlugin from '../packages/dev-console/src/plugin';
import KnativePlugin from '../packages/knative-plugin/src/plugin';
import KubeVirtPlugin from '../packages/kubevirt-plugin/src/plugin';
import Metal3Plugin from '../packages/metal3-plugin/src/plugin';
import NoobaStoragePlugin from '../packages/noobaa-storage-plugin/src/plugin';

export * from '@console/plugin-sdk';

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

export const registry = new ExtensionRegistry(activePlugins);

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map(p => p.name).join(', ')}]`);
}
