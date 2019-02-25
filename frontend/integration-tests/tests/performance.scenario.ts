import { browser, ExpectedConditions as until } from 'protractor';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { OrderedMap } from 'immutable';

import { appHost } from '../protractor.conf';
import * as sidenavView from '../views/sidenav.view';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

const chunkedRoutes = OrderedMap<string, {section: string, name: string}>()
  .set('operator-management', {section: 'Catalog', name: 'Operator Management'})
  .set('daemon-set', {section: 'Workloads', name: 'Daemon Sets'})
  .set('deployment', {section: 'Workloads', name: 'Deployments'})
  .set('deployment-config', {section: 'Workloads', name: 'Deployment Configs'})
  .set('replicaset', {section: 'Workloads', name: 'Replica Sets'}) // TODO should be replica-set
  .set('replication-controller', {section: 'Workloads', name: 'Replication Controllers'})
  .set('stateful-set', {section: 'Workloads', name: 'Stateful Sets'})
  .set('job', {section: 'Workloads', name: 'Jobs'})
  .set('cron-job', {section: 'Workloads', name: 'Cron Jobs'})
  .set('configmap', {section: 'Workloads', name: 'Config Maps'})
  .set('hpa', {section: 'Workloads', name: 'HPAs'})
  .set('service', {section: 'Networking', name: 'Services'})
  .set('persistent-volume', {section: 'Storage', name: 'Persistent Volumes'})
  .set('persistent-volume-claim', {section: 'Storage', name: 'Persistent Volume Claims'})
  .set('storage-class', {section: 'Storage', name: 'Storage Classes'})
  .set('build-config', {section: 'Builds', name: 'Build Configs'})
  .set('image-stream', {section: 'Builds', name: 'Image Streams'})
  .set('node', {section: 'Administration', name: 'Nodes'})
  .set('service-account', {section: 'Administration', name: 'Service Accounts'})
  .set('resource-quota', {section: 'Administration', name: 'Resource Quotas'})
  .set('limit-range', {section: 'Administration', name: 'Limit Ranges'})
  .set('custom-resource-definition', {section: 'Administration', name: 'CRDs'})
  .set('catalog', {section: 'Catalog', name: 'Developer Catalog'})
  .set('operator-hub', {section: 'Catalog', name: 'Operator Hub'});

describe('Performance test', () => {

  it('checks bundle size using ResourceTiming API', async() => {
    const resources = await browser.executeScript<string[]>(() => performance.getEntriesByType('resource')
      .filter(({name}) => name.endsWith('.js') && name.indexOf('main') > -1 && name.indexOf('runtime') === -1)
      .map(({name, decodedBodySize}) => ({name: name.split('/').slice(-1)[0], size: Math.floor(decodedBodySize / 1024)}))
      .reduce((acc, val) => acc.concat(`${val.name.split('-')[0]}: ${val.size} KB, `), '')
    );

    writeFileSync(path.resolve(__dirname, '../../gui_test_screenshots/bundle-analysis.txt'), resources);

    expect(resources.length).not.toEqual(0);
  });

  it('downloads new bundle for "Overview" route', async() => {
    await browser.get(`${appHost}/status/all-namespaces`);
    await browser.wait(until.presenceOf(crudView.resourceTitle));

    const overviewChunk = await browser.executeScript<any>(() => performance.getEntriesByType('resource')
      .find(({name}) => name.endsWith('.js') && name.indexOf('cluster-overview') > -1));

    expect(overviewChunk).not.toBeNull();
    expect(overviewChunk.decodedBodySize).toBeLessThan(100000);
  });

  it('downloads new bundle for YAML editor route', async() => {
    await browser.get(`${appHost}/k8s/ns/openshift-console/configmaps`);
    await crudView.isLoaded();

    const initialChunks = await browser.executeScript<{name: string, size: number}[]>(() => performance.getEntriesByType('resource')
      .filter(({name}) => name.endsWith('.js')));

    await crudView.selectOptionFromGear('console-config', 'Edit Config Map');
    await yamlView.isLoaded();

    const postChunks = await browser.executeScript<{name: string, size: number}[]>(() => performance.getEntriesByType('resource')
      .filter(({name}) => name.endsWith('.js')));

    expect(initialChunks.length).toBeLessThan(postChunks.length);
  });

  chunkedRoutes.forEach((route, routeName) => {
    const chunkLimit = 15000;

    const routeChunkFor = function() {
      const chunkName = arguments[0];
      return performance.getEntriesByType('resource').find(({name}) => name.endsWith('.js') && name.indexOf(chunkName) > -1);
    };

    it(`downloads new bundle for ${routeName}`, async() => {
      await browser.get(`${appHost}/k8s/cluster/projects`);
      await browser.executeScript(() => performance.setResourceTimingBufferSize(1000));
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      // Avoid problems where the Catalog nav section appears where Workloads was at the moment the tests try to click.
      await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Catalog')));
      await sidenavView.clickNavLink([route.section, route.name]);
      await crudView.isLoaded();

      const routeChunk = await browser.executeScript<PerformanceEntry>(routeChunkFor, routeName);

      expect(routeChunk).not.toBeNull();
      // FIXME: Really need to address this chunk size
      if (routeName === 'catalog' || routeName === 'operator-hub') {
        expect((routeChunk as any).decodedBodySize).toBeLessThan(100000);
      } else {
        expect((routeChunk as any).decodedBodySize).toBeLessThan(chunkLimit);
      }
    });
  });
});
