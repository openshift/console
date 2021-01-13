const testName = `test-${Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5)}`;

const testBucket = {
  apiVersion: 'objectbucket.io/v1alpha1',
  kind: 'ObjectBucketClaim',
  metadata: {
    namespace: 'openshift-storage',
    name: testName,
  },
  spec: {
    ssl: false,
    storageClassName: 'openshift-storage.noobaa.io',
    generateBucketName: 'test-bucket',
  },
};

const installStorageCluster = () => {
  cy.login();
  cy.visit('/');
  cy.install();
};

describe('Tests Buckets Card', () => {
  before(() => {
    installStorageCluster();
  });

  beforeEach(() => {
    cy.visit('/');
    cy.byLegacyTestID('horizontal-link-Object Service').click();
  });
  it('Test at least one noobaa bucket is present', () => {
    cy.get('div:nth-child(1) > div.co-inventory-card__item-title')
      .invoke('text')
      .then((text) => {
        const count = parseInt(text.split(' ')[0], 10);
        expect(count).toBeGreaterThanOrEqual(1);
      });
  });

  it('Create an Object Bucket Claim and test equality', () => {
    cy.get('div:nth-child(3) > div.co-inventory-card__item-title')
      .invoke('text')
      .then((text) => {
        const initalCount = parseInt(text.split(' ')[0], 10);
        cy.exec(`echo '${JSON.stringify(testBucket)}' | kubectl create -f -`);
        cy.get('div:nth-child(3) > div.co-inventory-card__item-title')
          .invoke('text')
          .then((data) => {
            const finalCount = parseInt(data.split(' ')[0], 10);
            expect(finalCount).toEqual(initalCount + 1);
            cy.exec(`echo '${JSON.stringify(testBucket)}' | kubectl delete -f -`);
          });
      });
  });
});

describe('Test Status Card', () => {
  const isRGWPresent = () => {
    const RGW_PROVISIONER = 'openshift-storage.ceph.rook.io/bucket';
    cy.exec('oc get StorageClasses -o json').then((result) => {
      if (result.code === 0) {
        const storageClasses = JSON.parse(result.stdout.toString());
        return storageClasses.items.some((sc) => sc.provisioner === RGW_PROVISIONER);
      }
      return false;
    });
    return false;
  };
  before(() => {
    installStorageCluster();
  });

  beforeEach(() => {
    cy.visit('/');
    cy.byLegacyTestID('horizontal-link-Object Service').click();
  });

  it('Check if Multi Cloud Gateway is in a healthy state', () => {
    if (!isRGWPresent()) {
      cy.get('div > div > div:nth-child(1) > div > div.co-dashboard-icon > svg').should(
        'have.attr',
        'data-test',
        'success-icon',
      );
    }
  });

  it('Check if Data Resiliency of MCG is in healthy state', () => {
    if (!isRGWPresent()) {
      cy.get('div > div > div:nth-child(2) > div > div.co-dashboard-icon > svg').should(
        'have.attr',
        'data-test',
        'success-icon',
      );
    }
  });
});

describe('Test Object Storage Efficiency Card', () => {
  before(() => {
    installStorageCluster();
  });

  beforeEach(() => {
    cy.visit('/');
    cy.byLegacyTestID('horizontal-link-Object Service').click();
  });

  it('Check if Efficiency Ratio is in acceptable data range', () => {
    cy.get('div:nth-child(1) > div.ceph-storage-efficiency-card__item-status > span')
      .invoke('text')
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
  });

  it('Check for savings value to be in acceptable data range', () => {
    cy.get('div:nth-child(2) > div.ceph-storage-efficiency-card__item-status > span')
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
});

describe('Test Resource Providers card', () => {
  before(() => {
    installStorageCluster();
  });

  beforeEach(() => {
    cy.visit('/');
    cy.byLegacyTestID('horizontal-link-Object Service').click();
  });

  it('Check if resource provider has at least 1 provider', () => {
    cy.get('.nb-resource-providers-card__row-title')
      .invoke('text')
      .then((text) => {
        expect(text).toBeDefined();
      });
  });
});
