import { createNAD, deleteNAD } from '../../views/nad';

const name = 'test-nad';
const bridge = 'br0';

describe('Test network attachment definition', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
  });

  it('ID(CNV-3256) Create NAD', () => {
    createNAD(name, bridge);
  });

  it('ID(CNV-4288) Delete NAD', () => {
    deleteNAD(name);
  });
});
