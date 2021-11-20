import { K8S_KIND } from '../../utils/const/index';
import { createNAD, deleteNAD } from '../../views/nad';

const name = 'test-nad';
const name1 = 'nad-uncheck-macspoof';
const bridge = 'br0';
// TODO: Don't use default project after bz2023560 is fixed.
const testName = 'default';

describe('Test network attachment definition', () => {
  before(() => {
    cy.Login();
  });

  beforeEach(() => {
    cy.visitNADPage();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.NAD, name, testName);
    cy.deleteResource(K8S_KIND.NAD, name1, testName);
  });

  it('ID(CNV-3256) Create NAD with MAC Spoof checked', () => {
    createNAD(name, bridge);
    cy.exec(`oc get net-attach-def ${name} -n ${testName} -o jsonpath={.spec.config}`).then(
      (output) => {
        const res = JSON.parse(output.stdout);
        expect(res.macspoofchk).toEqual(true);
      },
    );
  });

  it('ID(CNV-7522) Create NAD with MAC Spoof unchecked', () => {
    createNAD(name1, bridge, true);
    cy.exec(`oc get net-attach-def ${name1} -n ${testName} -o jsonpath={.spec.config}`).then(
      (output) => {
        const res = JSON.parse(output.stdout);
        expect(res.macspoofchk).toEqual(false);
      },
    );
  });

  it('ID(CNV-4288) Delete NAD', () => {
    deleteNAD(name);
    deleteNAD(name1);
  });
});
