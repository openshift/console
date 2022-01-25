import { ODFCommon } from '../../../integration-tests-cypress/views/common';
import { listPage } from '../../../integration-tests-cypress/views/list-page';
import { STORAGE_SYSTEM_NAME } from '../consts';
import { testBucket } from '../utils/consts';

describe('Tests Buckets, Status, Object Storage Efficiency, and Resource Providers Cards', () => {
  before(() => {
    cy.login();
    cy.visit('/');
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

  it('Tests Buckets Cards', () => {
    // TODO add test for "atleast one Noobaa bucket is present" (using Prometheus APIs)

    cy.log('Create an Object Bucket Claim and test equality');
    cy.exec(`kubectl get ObjectBucketClaims -A | wc -l`).then(({ stdout }) => {
      // "-1" excludes the first heading row from the initial OBC count.
      let initCount = parseInt(stdout, 10);
      initCount = initCount ? initCount - 1 : initCount;
      cy.exec(`echo '${JSON.stringify(testBucket)}' | kubectl create -f -`);
      const newCount = initCount + 1;
      cy.byTestID('resource-inventory-item-obc').contains(
        `${newCount} Object Bucket Claim${newCount > 1 ? 's' : ''}`,
      );
      cy.exec(`echo '${JSON.stringify(testBucket)}' | kubectl delete -f -`);
    });
  });

  it('Test Status Cards', () => {
    cy.log('Check if Multi Cloud Gateway is in a healthy state');
    cy.byTestID('Object Service-health-item-icon').within(() => {
      cy.byTestID('success-icon');
    });

    cy.log('Check if Data Resiliency of MCG is in healthy state');
    cy.byTestID('Data Resiliency-health-item-icon').within(() => {
      cy.byTestID('success-icon');
    });
  });

  it('Test Object Storage Efficiency Card', () => {
    cy.log('Check if Efficiency Ratio is in acceptable data range');
    cy.byTestID('Compression ratio-efficiency-card-status')
      .invoke('text')
      .should('not.eq', '')
      .then((text) => {
        const [ratioA, ratioB] = text.split(':');
        const [numA, numB] = [Number(ratioA), Number(ratioB)];
        if (Number.isNaN(numA) || Number.isNaN(numB)) {
          expect(text).toEqual('Not available');
        } else {
          expect(numA).toBeGreaterThan(0);
          expect(numB).toEqual(1);
        }
      });

    cy.log('Check for savings value to be in acceptable data range');
    cy.byTestID('Savings-efficiency-card-status')
      .invoke('text')
      .then((text) => {
        const [savDigits] = text.split(' ');
        const numSav = Number(savDigits);
        if (Number.isNaN(numSav)) {
          expect(text.trim()).toEqual('Not available');
        } else {
          expect(numSav).toBeGreaterThanOrEqual(0);
        }
      });
  });

  it('Test Resource Providers card', () => {
    cy.log('Check if resource provider has at least 1 provider');
    cy.byTestID('nb-resource-providers-card')
      .invoke('text')
      .then((text) => {
        expect(text).toBeDefined();
      });
  });
});
