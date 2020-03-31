import { $, browser, ExpectedConditions as EC } from 'protractor';
import { click } from './elementInteractions';

export const ELEMENT_WAIT = 15000;

export enum NavigationMenu {
  Add = '+Add',
  Topology = ' Topology',
  Monitoring = 'Monitoring',
  Builds = 'Builds',
  Search = 'Search',
  Helm = 'Helm',
  ProjectDetails = 'Project Details',
  ProjectAccess = 'Project Access',
  Pipelines = 'Pipelines',
}

export const naviagteTo = async function(opt: NavigationMenu) {
  switch (opt) {
    case NavigationMenu.Add: {
      await click($('[data-test-id="+Add-header"]'));
      await browser.wait(EC.urlContains('add'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Topology: {
      await click($('[data-test-id="topology-header"]'));
      await browser.wait(EC.titleContains('Topology · OKD'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Monitoring: {
      await click('[data-test-id="monitoring-header"]');
      await browser.wait(EC.titleContains('Dashboard · OKD'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Builds: {
      await click($('[data-test-id="build-header"]'));
      await browser.wait(EC.titleContains('Builds · OKD'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Pipelines: {
      // Pipeline operator installation is required
      await click($('[data-test-id="pipeline-header"]'));
      await browser.wait(EC.urlContains('Pipeline'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Search: {
      await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]'));
      await click($('[data-test-id="more-search-header"]'));
      await browser.wait(EC.titleContains('Search · OKD'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.Helm: {
      await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]'));
      await click($('[data-test-id="helm-releases-header"]'));
      await browser.wait(EC.titleContains('Helm Releases · OKD'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.ProjectDetails: {
      await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]'));
      await click($('[data-test-id="more-project-header"]'));
      await browser.wait(EC.urlContains('projects'), ELEMENT_WAIT);
      break;
    }
    case NavigationMenu.ProjectAccess: {
      await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]'));
      await click($('[data-test-id="more-project-access-header"]'));
      await browser.wait(EC.urlContains('project-access'), ELEMENT_WAIT);
      break;
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};
