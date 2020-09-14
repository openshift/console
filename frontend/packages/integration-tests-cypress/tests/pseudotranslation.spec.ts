import { checkErrors, testName } from '../support';
import { navigation } from '../views/navigation';
import { nav } from '../views/nav';

describe('Localization', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('pseudolocalizes navigation', () => {
    cy.log('test navigation');
    cy.visit('/dashboards?pseudolocalization=true');
    navigation.items.shouldBeLoaded();
    nav.sidenav.shouldHaveNavSection(['[Ḥṓṓṃḛḛ]']);
  });

  /* it('pseudolocalizes timestamp', () => {
    cy.log('test navigation');
    cy.visit('/?pseudolocalization=true');
    navigation.items.shouldBeLoaded();
    navigation.items.shouldExist('[Ḥṓṓṃḛḛ]');
  }); */
});
