import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import { execSync } from 'child_process';
import * as networkingView from '../views/networking.view';
import { $$} from 'protractor';
import * as secretsView from '../views/secrets.view';
import * as crudView from '../views/crud.view';


describe('Interacting with route creation forms', () => {
  beforeAll(async() => {
    execSync(`kubectl create -f ./integration-tests/data/caddy-docker.json -n ${testName}`);
    execSync(`kubectl create -f ./integration-tests/data/service-unsecure.json -n ${testName}`);
  });

  beforeEach(async()=> networkingView.visitRoutesPage(appHost, testName));

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async() => {
    execSync(`kubectl delete pod caddy-docker -n ${testName}`);
    execSync(`kubectl delete service service-unsecure -n ${testName}`);
  });

  const unsecureServiceName = 'service-unsecure';

  it('Unsecured route should prefix with http ', async() => {
    const unsecureRouteName = 'my-unsecure-route';
    await networkingView.createUnsecureRoute(unsecureRouteName, unsecureServiceName);
    await networkingView.visitRoutesDetailsPage(appHost, testName, unsecureRouteName);
    await crudView.isLoaded();
    const hostSearchLabel = 'LOCATION';
    const hostnameFoundIndex = await networkingView.getKeyIndex(await $$('dt'), hostSearchLabel, async(label) => {
      return await label.getText() === hostSearchLabel;
    });
    const hostNameInYAML = secretsView.getPathInJSON('spec.host',unsecureRouteName, testName, 'route');
    $$('dd').then( items => {
      expect(items[hostnameFoundIndex].getText()).toBe(`http://${ hostNameInYAML }`);
    });
    expect($$('.co-m-pane__body').get(1).getText()).toContain('TLS Settings');
    expect($$('.co-m-pane__body').get(1).getText()).toContain('TLS is not enabled');
  });
});
