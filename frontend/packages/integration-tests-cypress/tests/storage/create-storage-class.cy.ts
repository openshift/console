import { provisionersMap } from '../../mocks/storage-class';
import { guidedTour } from '../../views/guided-tour';
import { nav } from '../../views/nav';
import {
  createStorageClassValidateAndCleanUp,
  fillStorageClassInformation,
  validatePresenceOfParameterAndFeedData,
} from '../../views/storage/create-storage-class';

describe('Test creation of Storage classes using various provisioners', () => {
  before(() => {
    cy.login();
    guidedTour.close();
    nav.sidenav.clickNavLink(['Storage', 'StorageClasses']);
  });

  beforeEach(() => {
    cy.byTestID('item-create').click();
  });

  Object.entries(provisionersMap).forEach(([provisionerName, parameters]) => {
    it(`Create ${provisionerName} based storage class`, () => {
      fillStorageClassInformation(provisionerName);
      parameters.forEach((parameter) => validatePresenceOfParameterAndFeedData(parameter));
      createStorageClassValidateAndCleanUp(provisionerName, parameters);
    });
  });
});
