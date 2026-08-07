import { catalogPage } from '@dev-console/integration-tests/support/pages/add-flow/catalog-page';
import { Given } from 'cypress-cucumber-preprocessor/steps';

Given(
  'user has installed helm chart {string} with helm release name {string}',
  (chartName: string, releaseName: string) => {
    catalogPage.createHelmChart(releaseName, chartName);
  },
);
