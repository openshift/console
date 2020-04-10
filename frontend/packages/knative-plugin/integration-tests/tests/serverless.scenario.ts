import { browser, ExpectedConditions as until } from 'protractor';
import {
  switchPerspective,
  Perspective,
  sideHeader,
} from '../../../dev-console/integration-tests/views/dev-perspective.view';
import { appHost, checkErrors, checkLogs } from '../../../../integration-tests/protractor.conf';
import {
  routesValidation,
  machineCount,
  pageSidebar,
  knativeServingNS,
} from '../views/serverless.view';
import {
  installKnOperator,
  knativeServingYAML,
  increaseMachineSets,
  checkServerlessInstalled,
} from '../utils/install-serverless-operator';
import * as sidenavView from '../../../../integration-tests/views/sidenav.view';
import * as crudView from '../../../../integration-tests/views/crud.view';
import * as operatorView from '../../../operator-lifecycle-manager/integration-tests/views/operator.view';


const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 3000 * 60 * 5;

describe('Serverless', async () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');

    // Extend the default jasmine timeout interval just in case it takes a while for the htpasswd idp to be ready
    jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;
  });

  afterAll(() => {
    // Set jasmine timeout interval back to the original value after these tests are done
    jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_DEFAULT_TIMEOUT_INTERVAL;
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('install the serverless operator', async () => {
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await installKnOperator();
    expect(operatorView.rowForOperator('OpenShift Serverless Operator').isDisplayed()).toBe(true);
  });

  it('apply knative-service yaml', async () => {
    await knativeServingYAML();
    expect(knativeServingNS.isDisplayed()).toBe(true);
  });

  it('increase the machince sets', async () => {
    await increaseMachineSets();
    expect(machineCount.isDisplayed()).toBe(true);
  });

  it('Validate whether OpenShift Serverless Operator is installed or not', async () => {
    await checkServerlessInstalled();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(pageSidebar));
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Serverless')));
    await sidenavView.clickNavLink(['Serverless', 'Routes']);
    await browser.wait(until.visibilityOf(routesValidation));
    expect(routesValidation.isDisplayed()).toBe(true);
  });
});
