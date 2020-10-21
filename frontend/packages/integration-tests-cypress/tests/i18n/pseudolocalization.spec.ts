import { checkErrors } from '../../support';
import { masthead } from '../../views/masthead';
import { OrderedMap } from 'immutable';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';
import { errorMessage } from '../../views/form';
import { modal } from '../../views/modal';
import { detailsPage } from '../../views/details-page';

describe('Localization', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  const tableColumnHeaders =
    'th > .pf-c-table__button > .pf-c-table__button-content > .pf-c-table__text';
  const sectionHeadings = '[data-test-section-heading]';
  const detailLabels = 'dt';
  const i18nTranslated = '[data-i18n-translated]';

  const createExampleResource = () => {
    let initialUrl;
    cy.url().then((url) => {
      initialUrl = url;
    });
    listPage.clickCreateYAMLbutton();
    cy.byTestID('resource-sidebar').should('exist');
    yamlEditor.isLoaded();
    yamlEditor.clickSaveCreateButton();
    cy.get(errorMessage).should('not.exist');
    cy.then(() => cy.visit(initialUrl));
  };

  const deleteExampleResource = (kind: string) => {
    cy.url().then((url) => {
      if (url.includes('example')) {
        detailsPage.clickPageActionFromDropdown(`Delete ${kind}`);
      } else {
        listPage.rows.clickKebabAction('example', `Delete ${kind}`);
      }
    });
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
  };

  const testObjs = OrderedMap<string, LocalizationTestProps>()
    .set('Masthead', {
      url: '/settings/cluster',
      beforeTest: () => masthead.clickMastheadLink('help-dropdown-toggle'),
      testIDs: ['application-launcher-item'],
    })
    .set('Sidebar navigation', {
      url: '/settings/cluster',
      testIDs: ['nav'],
    })
    .set('Cluster dashboard', {
      url: '/dashboards',
      testIDs: [
        'activity',
        'activity-recent-title',
        'ongoing-title',
        'events-view-all-link',
        'events-pause-button',
        'utilization-card-item-text',
      ],
    })
    .set('Events', {
      url: '/k8s/all-namespaces/events',
      testIDs: ['timestamp'],
    })
    .set('Services list', {
      url: '/k8s/all-namespaces/services',
      resourcesListPage: true,
    })
    .set('Service details', {
      url: '/k8s/all-namespaces/services/alertmanager-main',
      resourceDetailsPage: true,
      selectors: [i18nTranslated], // elements with `data-i18n-translated` attribute should be translated
    })
    .set('Routes list', {
      url: '/k8s/all-namespaces/routes',
      resourcesListPage: true,
      beforeTest: () => listPage.filter.clickFilterDropdown(),
      selectors: ['.pf-c-dropdown__group-title', '.co-filter-dropdown-item__name'],
    })
    .set('Route details', {
      url: '/k8s/all-namespaces/routes/alertmanager-main',
      resourceDetailsPage: true,
      selectors: ['.graph-title'],
    })
    .set('Ingresses list', {
      url: '/k8s/all-namespaces/ingresses',
      resourcesListPage: true,
      beforeTest: () => createExampleResource(),
      afterTest: () => deleteExampleResource('Ingress'),
    })
    .set('Ingress details', {
      url: '/k8s/all-namespaces/ingresses',
      resourceDetailsPage: true,
      beforeTest: () => {
        createExampleResource();
        listPage.rows.clickRowByName('example');
      },
      selectors: [i18nTranslated],
      afterTest: () => deleteExampleResource('Ingress'),
    })
    .set('Policies list', {
      url: '/k8s/all-namespaces/networkpolicies',
      resourcesListPage: true,
      beforeTest: () => createExampleResource(),
      afterTest: () => deleteExampleResource('Network Policy'),
    })
    .set('Policy details', {
      url: '/k8s/all-namespaces/networkpolicies',
      resourceDetailsPage: true,
      beforeTest: () => {
        createExampleResource();
        listPage.rows.clickRowByName('example');
      },
      selectors: [i18nTranslated],
      afterTest: () => deleteExampleResource('Network Policy'),
    });

  testObjs.forEach(
    (
      {
        url,
        resourcesListPage = false,
        resourceDetailsPage = false,
        beforeTest,
        afterTest,
        testIDs = [],
        selectors = [],
      },
      resource,
    ) => {
      it(`pseudolocalizes ${resource}`, () => {
        const baseUrl = new URL(url, Cypress.config('baseUrl'));
        const params = new URLSearchParams();
        params.set('pseudolocalization', 'true');
        params.set('lng', 'en');
        const pseudoLocUrl = `${baseUrl.pathname}?${params.toString()}${baseUrl.hash}`;
        cy.visit(pseudoLocUrl);

        if (beforeTest) {
          beforeTest();
        }

        if (resourcesListPage) {
          selectors.push(tableColumnHeaders); // all resource list page table column headers should be translated
        }

        if (resourceDetailsPage) {
          selectors.push(sectionHeadings); // all section headings should be translated
          selectors.push(detailLabels); // all detail item labels should be translated
          testIDs.push('timestamp');
        }

        testIDs.forEach((testId) => cy.byTestID(testId).isPseudoLocalized());

        selectors.forEach((selector) =>
          cy.get(selector).each(($el) => {
            cy.wrap($el).isPseudoLocalized();
          }),
        );

        if (afterTest) {
          afterTest();
        }
      });
    },
  );
});

type LocalizationTestProps = {
  url: string;
  resourcesListPage?: boolean;
  resourceDetailsPage?: boolean;
  beforeTest?: () => any;
  afterTest?: () => any;
  testIDs?: string[];
  selectors?: string[];
};
