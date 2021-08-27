import { TEMPLATE_NAME } from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { Disk, VirtualMachineData } from '../../types/vm';
import { addDisk } from '../../view/dialog';
import { tab } from '../../view/tab';
import { virtualization } from '../../view/virtualization';
import { vm } from '../../view/vm';

const disk1: Disk = {
  name: 'preallocation-disk-1',
  size: '1',
  preallocation: true,
};

const vmData: VirtualMachineData = {
  name: `validate-disk-preallocation-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

describe('Test disk preallocation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vm.create(vmData);
    virtualization.vms.visit();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
  });

  it('ID(CNV-6955) Verify preallocation is true in disk data volume', () => {
    tab.navigateToDisk();
    addDisk(disk1);
    cy.get(`[data-id="${disk1.name}"]`).should('exist');
    cy.exec(`oc get dv -n ${testName} | grep ${disk1.name} | awk '{print $1}'`).then((output) => {
      const dv = output.stdout;
      cy.exec(`oc get datavolume ${dv} -n ${testName} -o jsonpath={.spec.preallocation}`).then(
        (output1) => {
          const preallocation = output1.stdout;
          expect(preallocation).toEqual('true');
        },
      );
    });
  });
});
