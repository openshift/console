import {click} from './elementInteractions';
import {$, browser, ExpectedConditions as EC} from 'protractor';
const waitForElement = 5000;

export enum NavigationMenu {
    Add = '+Add',
    Topology = ' Topology',
    Monitoring = 'Monitoring',
    Builds = 'Builds',
    Search = 'Search',
    Helm = 'Helm',
    ProjectDetails = 'Project Details',
    ProjectAccess = 'Project Access'
  }

export const naviagteTo = async function(opt: NavigationMenu) {
    switch (opt) {
      case NavigationMenu.Add: {
        await click($('[data-test-id="+Add-header"]'));
        await browser.wait(EC.visibilityOf($('span[data-test-id="resource-title"]')), waitForElement);  
        break;
      }
      case NavigationMenu.Topology: {
        await click($('[data-test-id="topology-header"]'));
        await browser.wait(EC.titleContains('Topology · OKD'), waitForElement);
        break;
      }
      case NavigationMenu.Monitoring: {
        await click('[data-test-id="monitoring-header"]');
        await browser.wait(EC.titleContains('Dashboard · OKD'), waitForElement);
        break;
      }
      case NavigationMenu.Builds: {
        await click($('[data-test-id="build-header"]'));
        await browser.wait(EC.titleContains('Builds · OKD'), waitForElement);
        break;
      }
      case NavigationMenu.Search: {
          await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]')).then(async () => {
            await click($('[data-test-id="more-search-header"]'));
            await browser.wait(EC.titleContains('Search · OKD'), waitForElement);
          })
        break;
      }
      case NavigationMenu.Helm: {
        await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]')).then(async () => {
            await click($('[data-test-id="helm-releases-header"]'));
            await browser.wait(EC.titleContains('Helm Releases · OKD'), waitForElement);
          })
        break;
      }
      case NavigationMenu.ProjectDetails: {
        await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]')).then(async () => {
            await click($('[data-test-id="more-project-header"]'));
            await browser.wait(EC.titleContains('Helm Releases · OKD'), waitForElement);
          })
        break;
      }
      case NavigationMenu.ProjectAccess: {
        await click($('a.pf-c-nav__link[data-component="pf-nav-expandable"]')).then(async () => {
            await click($('[data-test-id="more-project-access-header"]'));
            await browser.wait(EC.titleContains('Helm Releases · OKD'), waitForElement);
          })
        break;
      }
      default: {
        throw new Error('Option is not available');
      }
    }
  };
  