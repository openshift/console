import { ODFCommon } from '../../../integration-tests-cypress/views/common';
import { listPage } from '../../../integration-tests-cypress/views/list-page';
import { STORAGE_SYSTEM_NAME } from '../consts';

describe('Check noobaa link in obejct service dashboard and perform SSO', () => {
  before(() => {
    cy.login();
    cy.install();
    ODFCommon.visitStorageSystemList();
    listPage.searchInList(STORAGE_SYSTEM_NAME);
    // Todo(bipuladh): Add a proper data-selector once the list page is migrated
    // eslint-disable-next-line cypress/require-data-selectors
    cy.get('a')
      .contains(STORAGE_SYSTEM_NAME)
      .click();
    cy.contains('Object');
    cy.byLegacyTestID('horizontal-link-Object').click();
  });

  after(() => {
    cy.logout();
  });

  it('Check that noobaa dashboard is opening and links available.', () => {
    cy.byLegacyTestID('system-name-mcg')
      .invoke('attr', 'href')
      .then((href) => {
        cy.request(href).then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body).toContain('NooBaa Management Console');
        });
      });
  });
});
