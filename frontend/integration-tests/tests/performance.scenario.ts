import { browser, ExpectedConditions as until } from 'protractor';
import { OrderedMap } from 'immutable';

import { appHost } from '../protractor.conf';
import * as sidenavView from '../views/sidenav.view';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

const chunkedRoutes = OrderedMap<string, { section: string; name: string }>()
  .set('daemon-set', { section: 'Workloads', name: 'DaemonSets' })
  .set('deployment', { section: 'Workloads', name: 'Deployments' })
  .set('deployment-config', { section: 'Workloads', name: 'DeploymentConfigs' })
  .set('replicaset', { section: 'Workloads', name: 'ReplicaSets' }) // TODO should be replica-set
  .set('replication-controller', { section: 'Workloads', name: 'ReplicationControllers' })
  .set('stateful-set', { section: 'Workloads', name: 'StatefulSets' })
  .set('job', { section: 'Workloads', name: 'Jobs' })
  .set('cron-job', { section: 'Workloads', name: 'CronJobs' })
  .set('configmap', { section: 'Workloads', name: 'ConfigMaps' })
  .set('hpa', { section: 'Workloads', name: 'HorizontalPodAutoscalers' })
  .set('service', { section: 'Networking', name: 'Services' })
  .set('persistent-volume', { section: 'Storage', name: 'PersistentVolumes' })
  .set('persistent-volume-claim', { section: 'Storage', name: 'PersistentVolumeClaims' })
  .set('storage-class', { section: 'Storage', name: 'StorageClasses' })
  .set('build-config', { section: 'Builds', name: 'BuildConfigs' })
  .set('image-stream', { section: 'Builds', name: 'ImageStreams' })
  .set('node', { section: 'Compute', name: 'Nodes' })
  .set('service-account', { section: 'User Management', name: 'ServiceAccounts' })
  .set('limit-range', { section: 'Administration', name: 'LimitRanges' })
  .set('custom-resource-definition', {
    section: 'Administration',
    name: 'CustomResourceDefinitions',
  })
  .set('operator-hub', { section: 'Operators', name: 'OperatorHub' });

describe('Performance test', () => {
  it('downloads new bundle for YAML editor route', async () => {
    await browser.get(`${appHost}/k8s/ns/openshift-console/configmaps`);
    await crudView.isLoaded();

    const initialChunks = await browser.executeScript(() =>
      performance.getEntriesByType('resource').filter(({ name }) => name.endsWith('.js')),
    );

    await crudView.clickKebabAction('console-config', 'Edit ConfigMap');
    await yamlView.isLoaded();

    const postChunks = await browser.executeScript(() =>
      performance.getEntriesByType('resource').filter(({ name }) => name.endsWith('.js')),
    );

    expect(initialChunks.length).toBeLessThan(postChunks.length);
  });

  chunkedRoutes.forEach((route, routeName) => {
    const chunkLimit = 25000;

    const routeChunkFor = function() {
      const chunkName = arguments[0];
      return performance
        .getEntriesByType('resource')
        .find(({ name }) => name.endsWith('.js') && name.indexOf(`/${chunkName}-chunk`) > -1);
    };

    // Temporarily disable performance tests.
    it(`downloads new bundle for ${routeName}`, async () => {
      await browser.get(`${appHost}/k8s/cluster/namespaces`);
      await crudView.isLoaded();
      await browser.executeScript(() => performance.setResourceTimingBufferSize(1000));
      // Avoid problems where the Operators nav section appears where Workloads was at the moment the tests try to click.
      await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Operators')));
      await sidenavView.clickNavLink([route.section, route.name]);
      await browser.wait(crudView.untilNoLoadersPresent);

      const routeChunk = await browser.executeScript(routeChunkFor, routeName);

      expect(routeChunk).not.toBeNull();
      // FIXME: Really need to address this chunk size
      // TODO(jtomasek): extract common node components to @console/shared to reduce node chunk size
      if (['catalog', 'operator-hub', 'node'].includes(routeName)) {
        expect((routeChunk as any).decodedBodySize).toBeLessThan(150000);
      } else {
        expect((routeChunk as any).decodedBodySize).toBeLessThan(chunkLimit);
      }
    });
  });
});
