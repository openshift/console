import { expect } from 'chai';
import { listPage } from '../views/list-page';

declare global {
  namespace Cypress {
    interface Chainable {
      isPseudoLocalized(): Chainable<Element>;
      testI18n(selectors?: string[], testIDs?: string[]): Chainable<Element>;
      visitWithDefaultLang(url: string): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('testI18n', (selectors: string[] = [], testIDs: string[] = []) => {
  cy.location().then((loc) => {
    const params = new URLSearchParams(loc.search);
    params.set('pseudolocalization', 'true');
    params.set('lng', 'en');
    const pseudoLocUrl = `${loc.pathname}?${params.toString()}`;

    cy.visitWithDefaultLang(pseudoLocUrl);

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000); // don't know what to wait for since could be list or detail page

    // if PF toolbar, click to open 'search by' dropdown
    cy.get('#content').then(($body) => {
      if ($body.find('#filter-toolbar').length) {
        cy.get('#content').within(() => {
          listPage.filter.clickSearchByDropdown();
          cy.byLegacyTestID('dropdown-menu').isPseudoLocalized(); // 'search by' menu items
        });
      }

      testIDs.forEach((testId) => cy.byTestID(testId).isPseudoLocalized());
      selectors.forEach((selector) =>
        cy.get(selector).each(($el) => {
          const i18nNotTranslatedAttr = $el.attr('i18n-not-translated');
          if (!i18nNotTranslatedAttr) {
            cy.wrap($el).isPseudoLocalized();
          }
        }),
      );
    });
  });
});

Cypress.Commands.add(
  'isPseudoLocalized',
  {
    prevSubject: true,
  },
  (subject) => {
    cy.wrap(subject).each(($el) => {
      const text = $el.text();
      if (text.length > 0) {
        expect(text).to.match(/\[[^a-zA-Z]+\]/);
      }
    });
  },
);

Cypress.Commands.add('visitWithDefaultLang', (url) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      Object.defineProperty(win.navigator, 'language', {
        value: 'en',
        writable: false,
      });
    },
  });
});
