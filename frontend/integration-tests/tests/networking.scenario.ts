import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import { execSync } from 'child_process';
import { $$} from 'protractor';
import * as _ from 'lodash';
import * as networkingView from '../views/networking.view';
import * as crudView from '../views/crud.view';
import * as utilsView from '../views/utils.view';



describe('Interacting with route creation forms', () => {
  beforeAll(async() => {
    execSync(`oc create -f ./integration-tests/data/caddy-docker.yaml -n ${testName}`);
    execSync(`oc create -f ./integration-tests/data/service-unsecure.yaml -n ${testName}`);
  });

  beforeEach(async()=> networkingView.visitRoutesPage(appHost, testName));

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async() => {
    execSync(`oc delete pod caddy-docker -n ${testName}`);
    execSync(`oc delete service service-unsecure -n ${testName}`);
  });

  const unsecureServiceName = 'service-unsecure';

  it('Unsecured route should prefix with http', async() => {
    const unsecureRouteName = 'my-unsecure-route';
    await networkingView.createUnsecureRoute(unsecureRouteName, unsecureServiceName);
    await networkingView.visitRoutesDetailsPage(appHost, testName, unsecureRouteName);
    await crudView.isLoaded();
    const hostSearchLabel = 'LOCATION';
    const hostnameFoundIndex = await utilsView.getKeyIndex(await $$('dt'), hostSearchLabel, async(label) => {
      return await label.getText() === hostSearchLabel;
    });
    const routeJSON = JSON.parse(utilsView.getResourceJSON(unsecureRouteName, testName, 'route'));
    const hostNameInYAML = _.get(routeJSON, 'spec.host', undefined);
    $$('dd').then( items => {
      expect(items[hostnameFoundIndex].getText()).toBe(`http://${ hostNameInYAML }`);
    });
    expect($$('.co-m-pane__body').get(1).getText()).toContain('TLS Settings');
    expect($$('.co-m-pane__body').get(1).getText()).toContain('TLS is not enabled');
  });
});
