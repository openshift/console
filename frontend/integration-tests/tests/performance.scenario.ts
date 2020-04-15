import { browser, ExpectedConditions as until } from 'protractor';
import { OrderedMap } from 'immutable';

import { appHost } from '../protractor.conf';
import * as sidenavView from '../views/sidenav.view';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

const chunkedRoutes = OrderedMap<string, { section: string; name: string }>()
  .set('daemon-set', { section: 'Workloads', name: 'Daemon Sets' })
  .set('deployment', { section: 'Workloads', name: 'Deployments' })
  .set('deployment-config', { section: 'Workloads', name: 'Deployment Configs' })
  .set('replicaset', { section: 'Workloads', name: 'Replica Sets' }) // TODO should be replica-set
  .set('replication-controller', { section: 'Workloads', name: 'Replication Controllers' })
  .set('stateful-set', { section: 'Workloads', name: 'Stateful Sets' })
  .set('job', { section: 'Workloads', name: 'Jobs' })
  .set('cron-job', { section: 'Workloads', name: 'Cron Jobs' })
  .set('configmap', { section: 'Workloads', name: 'Config Maps' })
  .set('hpa', { section: 'Workloads', name: 'Horizontal Pod Autoscalers' })
  .set('service', { section: 'Networking', name: 'Services' })
  .set('persistent-volume', { section: 'Storage', name: 'Persistent Volumes' })
  .set('persistent-volume-claim', { section: 'Storage', name: 'Persistent Volume Claims' })
  .set('storage-class', { section: 'Storage', name: 'Storage Classes' })
  .set('build-config', { section: 'Builds', name: 'Build Configs' })
  .set('image-stream', { section: 'Builds', name: 'Image Streams' })
  .set('node', { section: 'Compute', name: 'Nodes' })
  .set('service-account', { section: 'User Management', name: 'Service Accounts' })
  .set('limit-range', { section: 'Administration', name: 'Limit Ranges' })
  .set('custom-resource-definition', {
    section: 'Administration',
    name: 'Custom Resource Definitions',
  })
  .set('operator-hub', { section: 'Operators', name: 'OperatorHub' });

describe('Performance test', () => {
  it('downloads new bundle for YAML editor route', async () => {
    await browser.get(`${appHost}/k8s/ns/openshift-console/configmaps`);
    await crudView.isLoaded();

    const initialChunks = await browser.executeScript(() =>
      performance.getEntriesByType('resource').filter(({ name }) => name.endsWith('.js')),
    );

    await crudView.clickKebabAction('console-config', 'Edit Config Map');
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
        expect((routeChunk as any).decodedBodySize).toBeLessThan(120000);
      } else {
        expect((routeChunk as any).decodedBodySize).toBeLessThan(chunkLimit);
      }
    });
  });
});
