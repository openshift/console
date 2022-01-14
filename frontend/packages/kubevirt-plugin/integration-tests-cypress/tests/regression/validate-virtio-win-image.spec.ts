import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { vm } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `validate-windows-virtio-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: TEMPLATE.WIN2K12R2,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

const testDescribe = Cypress.env('DOWNSTREAM') ? describe : xdescribe;

testDescribe('Test Windows VM virtio-win image', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMsList();
    vm.create(vmData);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-6732) [bz1942839] validate virtio-win-image of windows vm', () => {
    if (Cypress.env('DOWNSTREAM')) {
      cy.exec("oc get cm -n openshift-cnv virtio-win -o jsonpath='{.data.virtio-win-image}'").then(
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
