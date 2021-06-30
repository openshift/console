import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { virtualization } from '../../view/virtualization';
import { vm } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `validate-windows-virtio-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: 'Microsoft Windows Server 2019 VM',
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

describe('Test vm creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    virtualization.vms.visit();
    vm.create(vmData);
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

  it('ID(CNV-6732) [bz1942839] validate virtio-win-image of windows vm', () => {
    if (Cypress.env('DOWNSTREAM')) {
      cy.exec("oc get cm -n openshift-cnv v2v-vmware -o jsonpath='{.data.virtio-win-image}'").then(
        (result) => {
          const image = result.stdout;
          cy.exec(
            `oc get vm ${vmData.name} -n ${testName} -o jsonpath='{.spec.template.spec.volumes}'`,
          ).then((result1) => {
            const image1 = result1.stdout;
            expect(image1).toContain(image);
          });
        },
      );
    }
  });
});
