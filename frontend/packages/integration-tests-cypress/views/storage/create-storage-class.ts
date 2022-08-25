import * as _ from 'lodash';
import { StorageClass } from '@console/internal/components/storage-class-form';
import { detailsPage } from '../details-page';
import { modal } from '../modal';

export type Parameter = {
  name: string;
  id?: string;
  values?: string | string[];
  hintText?: string;
  nestedParameter?: Parameter;
};

enum ParameterType {
  DROPDOWN = 'DROPDOWN',
  CHECKBOX = 'CHECKBOX',
  TEXT = 'TEXT',
}

const getParameterType = (parameter: Parameter): ParameterType => {
  if (_.isArray(parameter.values)) return ParameterType.DROPDOWN;
  if (_.isString(parameter.values)) return ParameterType.TEXT;
  return ParameterType.CHECKBOX;
};

const COMMON_DESCRIPTION = 'Storage class to be used for E2E tests only.';

const getSCNameFromProvisioner = (provisionerName: string) => `${_.kebabCase(provisionerName)}-sc`;

const getParameterIdFromName = (name: string) => `storage-class-provisioner-${_.kebabCase(name)}`;

const validateDropdownElementsPresence = (elements: string[]) => {
  elements.forEach((element) => {
    cy.byTestDropDownMenu(element).should('be.visible');
  });
};

const getStorageClassParameterValue = (storageClass: StorageClass, key: string) =>
  storageClass.parameters[key];

const validateAttributes = (storageClass: StorageClass, parameters: Parameter[]) => {
  expect(storageClass.metadata.annotations.description).toEqual(COMMON_DESCRIPTION);
  parameters.forEach((parameter) => {
    const parameterType = getParameterType(parameter);
    if (parameterType === ParameterType.DROPDOWN) {
      expect(getStorageClassParameterValue(storageClass, parameter.id)).toEqual(
        parameter.values[0],
      );
    } else if (parameterType === ParameterType.CHECKBOX) {
      expect(getStorageClassParameterValue(storageClass, parameter.id)).toEqual('true');
    } else {
      expect(getStorageClassParameterValue(storageClass, parameter.id)).toEqual(parameter.values);
    }
  });
};

export const fillStorageClassInformation = (provisioner: string) => {
  const name = getSCNameFromProvisioner(provisioner);
  cy.byTestID('storage-class-name').type(name);
  cy.byTestID('storage-class-description').type(COMMON_DESCRIPTION);
  cy.byTestID('storage-class-provisioner-dropdown').click();
  cy.byLegacyTestID('dropdown-text-filter').type(provisioner);
  cy.contains(provisioner).click();
};

export const validatePresenceOfParameterAndFeedData = (parameter: Parameter) => {
  const elementId = getParameterIdFromName(parameter.name);
  cy.get('label').contains(parameter.name);
  const parameterType = getParameterType(parameter);
  if (parameterType === ParameterType.DROPDOWN) {
    cy.byTestID(elementId).click();
    validateDropdownElementsPresence(parameter.values as string[]);
    cy.byTestDropDownMenu(parameter.values[0]).click();
  } else if (parameterType === ParameterType.CHECKBOX) {
    cy.byTestID(elementId).click();
  } else if (parameterType === ParameterType.TEXT) {
    cy.byTestID(elementId).type(parameter.values as string);
  }
  if (parameter.hintText) {
    cy.contains(parameter.hintText).should('be.visible');
  }
  if (parameter.nestedParameter) {
    validatePresenceOfParameterAndFeedData(parameter.nestedParameter);
  }
};

export const createStorageClassValidateAndCleanUp = (
  provisioner: string,
  parameters: Parameter[],
) => {
  const name = getSCNameFromProvisioner(provisioner);
  // Creation
  cy.get('[id="save-changes"]').click();
  cy.byTestID('loading-indicator').should('not.exist');
  detailsPage.isLoaded();
  // Validation
  cy.exec(`oc get sc ${name} -o json`)
    .its('stdout')
    .then((response) => {
      const storageClass: StorageClass = JSON.parse(response);
      validateAttributes(storageClass, parameters);
    });
  // Cleanup
  detailsPage.clickPageActionFromDropdown('Delete StorageClass');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
};
