import { execSync } from 'child_process';
import { $, browser, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
  testName,
} from '@console/internal-integration-tests/protractor.conf';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as catalogView from '@console/internal-integration-tests/views/catalog.view';
import * as catalogPageView from '@console/internal-integration-tests/views/catalog-page.view';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';

describe('Interacting with OperatorHub', () => {
  const catalogSource = {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'CatalogSource',
    metadata: { name: 'console-e2e', labels: { 'olm-visibility': 'visible' } },
    spec: {
      sourceType: 'grpc',
      image:
        'quay.io/operator-framework/upstream-community-operators@sha256:5ae28f6de8affdb2a2119565ea950a2a777280b159f03b6ddddf104740571e25',
      displayName: 'Console E2E Operators',
      publisher: 'Red Hat, Inc',
    },
  };

  beforeAll(async () => {
    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${testName} -f -`);
    await new Promise((resolve) =>
      (function checkForPackages() {
        const output = execSync(
          `kubectl get packagemanifests -n ${testName} --selector=catalog=console-e2e -o json`,
        );
        if (
          JSON.parse(output.toString('utf-8')).items.find(
            (pkg) => pkg.status.catalogSource === catalogSource.metadata.name,
          )
        ) {
          resolve();
        } else {
          setTimeout(checkForPackages, 2000);
        }
      })(),
    );
  });

  afterAll(() => {
    execSync(`kubectl delete catalogsource -n ${testName} ${catalogSource.metadata.name}`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays OperatorHub tile view with expected available Operators', async () => {
    await browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await crudView.isLoaded();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters Operators by "Provider"', async () => {
    await catalogPageView
      .filterSectionFor('provider')
      .$$('.filter-panel-pf-category-item')
      .get(0)
      .$('input')
      .click();
    const filteredOperator = await catalogPageView.catalogTiles
      .first()
      .$('.catalog-tile-pf-title')
      .getText();

    await catalogPageView
      .filterSectionFor('provider')
      .$$('.filter-panel-pf-category-item')
      .get(0)
      .$('input')
      .click();
    await catalogPageView
      .filterSectionFor('provider')
      .$$('.filter-panel-pf-category-item')
      .get(1)
      .$('input')
      .click();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
    expect(
      catalogPageView.catalogTiles
        .first()
        .$('.catalog-tile-pf-title')
        .getText(),
    ).not.toEqual(filteredOperator);
  });

  it('filters Operators by name', async () => {
    await $('.co-catalog-page__filter input').click();
    const filteredOperator = await catalogPageView.catalogTiles
      .first()
      .$('.catalog-tile-pf-title')
      .getText();
    await catalogPageView.filterByKeyword(filteredOperator);

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
    expect(
      catalogPageView.catalogTiles
        .first()
        .$('.catalog-tile-pf-title')
        .getText(),
    ).toEqual(filteredOperator);
  });

  it('displays "Clear All Filters" text when filters remove all Operators from display', async () => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');

    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);
  });

  it('clears all filters when "Clear All Filters" text is clicked', async () => {
    await catalogPageView.clearFiltersText.click();

    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters Operators by catagory', async () => {
    await catalogView.categoryTabs.get(1).click();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });
});
