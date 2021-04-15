import { NS } from '../utils/consts';
import { commonFlows } from './common';
import { POOL_PROGRESS } from '../../src/constants/storage-pool-const';

// Pool var
export const poolName: string = 'example.pool';
export const replicaCount: string = '2';
export const volumeType: string = 'ssd';

export const poolMessage: {
  [key in POOL_PROGRESS]?: string;
} = {
  [POOL_PROGRESS.FAILED]: `Pool "${poolName}" already exists`,
  [POOL_PROGRESS.CREATED]: `Pool ${poolName} was successfully created`,
  [POOL_PROGRESS.NOTALLOWED]:
    "Pool management tasks are not supported for default pool and OpenShift Container Storage's external mode.",
};

const navigateToBlockPool = () => {
  commonFlows.navigateToOCS();
  cy.byLegacyTestID('horizontal-link-Block Pools').click();
};

export const populateBlockPoolForm = () => {
  cy.byTestID('new-pool-name-textbox').type(poolName);
  cy.byTestID('replica-dropdown').click();
  cy.byLegacyTestID('replica-dropdown-item')
    .contains(`${replicaCount}-way Replication`)
    .click();
  cy.byTestID('volume-type-dropdown').click();
  cy.byTestID('volume-type-dropdown-item')
    .contains(volumeType.toLocaleUpperCase())
    .click();
  cy.byTestID('compression-checkbox').check();
};

export enum Actions {
  created = 'created',
  failed = 'failed',
  notAllowed = 'notAllowed',
}

export const verifyFooterActions = (action: string) => {
  switch (action) {
    case Actions.failed:
      cy.log('Check try-again-action and finish-action are enabled');
      cy.byLegacyTestID('modal-try-again-action').should('be.visible');
      cy.byLegacyTestID('modal-finish-action').click();
      break;
    case Actions.created:
      cy.log('Check finish-action is enabled');
      cy.byLegacyTestID('modal-finish-action').click();
      break;
    case Actions.notAllowed:
      cy.log('Check close-action is enabled');
      cy.byLegacyTestID('modal-close-action').click();
      break;
    default:
      cy.log(`Invoke ${action} action`);
      cy.byLegacyTestID('confirm-action')
        .scrollIntoView()
        .click();
  }
};

export const verifyBlockPoolJSON = (
  compressionEnabled: boolean = true,
  replica: string = replicaCount,
) =>
  cy.exec(`oc get cephBlockPool ${poolName} -n  ${NS} -o json`).then((res) => {
    const blockPool = JSON.parse(res.stdout);
    expect(blockPool.spec?.replicated?.size).toEqual(Number(replica));
    expect(blockPool.spec?.compressionMode).toEqual(compressionEnabled ? 'aggressive' : 'none');
    expect(blockPool.spec?.parameters?.compression_mode).toEqual(
      compressionEnabled ? 'aggressive' : 'none',
    );
    expect(blockPool.spec?.deviceClass).toEqual(volumeType);
  });

export const createBlockPool = () => {
  navigateToBlockPool();
  cy.byTestID('item-create').click();
  populateBlockPoolForm();
  verifyFooterActions('create');
  cy.log('Verify a new block pool creation');
  cy.byTestID('status-text').contains('Ready');
  verifyBlockPoolJSON();
  cy.byLegacyTestID('breadcrumb-link-1').click();
};

export const deleteBlockPoolFromCli = () => {
  cy.log('Deleting a pool');
  cy.exec(`oc delete CephBlockPool ${poolName} -n ${NS}`);
};
