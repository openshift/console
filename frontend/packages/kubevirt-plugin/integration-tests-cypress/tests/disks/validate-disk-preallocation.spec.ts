import { testName } from '../../support';
import { Disk, VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addDisk } from '../../views/dialog';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const disk1: Disk = {
  name: 'preallocation-disk-1',
  size: '1',
  preallocation: true,
};

const vmData: VirtualMachineData = {
  name: `validate-disk-preallocation-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL8,
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
