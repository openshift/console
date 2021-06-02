import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import * as yamlEditor from '../../views/yaml-editor';

const createExampleConfigMapInstance = () => {
  nav.sidenav.clickNavLink(['Workloads', 'ConfigMaps']);
  cy.byLegacyTestID('resource-title').should('have.text', 'ConfigMaps');
  listPage.clickCreateYAMLbutton();
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  yamlEditor.clickSaveCreateButton();
  cy.get(errorMessage).should('not.exist');
};

const deleteExampleConfigMapInstance = () => {
  detailsPage.isLoaded();
  detailsPage.titleShouldContain('example');
  detailsPage.clickPageActionFromDropdown('Delete ConfigMap');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
  cy.get(errorMessage).should('not.exist');
};

const getNameValueEditorRow = (row: number) => {
  return cy.byTestID('pairs-list-row').eq(row);
};

const setName = (row: JQuery<HTMLElement>, nameValue: string) => {
  cy.wrap(row).within(() => {
    cy.byTestID('pairs-list-name').type(nameValue);
  });
};
const setValue = (row: JQuery<HTMLElement>, value: string) => {
  cy.wrap(row).within(() => {
    cy.byTestID('pairs-list-value').type(value);
  });
};

const clearValue = (row: JQuery<HTMLElement>) => {
  cy.wrap(row).within(() => {
    cy.byTestID('pairs-list-value').clear();
  });
};
const nameValueEquals = (row: JQuery<HTMLElement>, name: string, value: string) => {
  cy.wrap(row).within(() => {
    cy.byTestID('pairs-list-name').should('have.value', name);
    cy.byTestID('pairs-list-value').should('have.value', value);
  });
};

describe('Annotations', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    createExampleConfigMapInstance();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    deleteExampleConfigMapInstance();
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`Creates, Edits, Updates, and Deletes Annotations`, () => {
    const ANNOTATION_KEY = 'ALPHA_Num_KEY-3';
    const ANNOTATION_VALUE = 'ALPHA_Num_VALUE-2';
    const annotations = [
      {
        key: 'ALPHA_Num_KEY-1',
        value: 'ALPHA_Num_VALUE-1',
      },
      {
        key: 'ALPHA_Num_KEY-2',
        value: '',
      },
      {
        key: '',
        value: 'ALPHA_Num_VALUE-3',
      },
    ];

    cy.url().should('include', `/k8s/ns/${testName}/configmaps/example`);
    detailsPage.isLoaded();
    detailsPage.titleShouldContain('example');
    cy.byTestID('edit-annotations').contains('0 annotations');

    cy.log('Add annotations');
    detailsPage.clickPageActionFromDropdown('Edit annotations');
    modal.shouldBeOpened();
    getNameValueEditorRow(0).then((row) => {
      setName(row, annotations[0].key);
      setValue(row, annotations[0].value);
    });
    cy.byTestID('add-button').click();
    getNameValueEditorRow(1).then((row) => {
      setName(row, annotations[1].key); // adding only a key, no value, for 2nd annotation
    });
    cy.byTestID('add-button').click();
    getNameValueEditorRow(2).then((row) => {
      setValue(row, annotations[2].value); // adding only a value, no key, for 3rd annotation
    });
    modal.submit();
    modal.shouldBeClosed();

    cy.log('Verify first two saved annotations');
    cy.byTestID('edit-annotations').contains('2 annotation'); // 3rd annotation without key should not have been saved
    detailsPage.clickPageActionFromDropdown('Edit annotations');
    modal.shouldBeOpened();
    getNameValueEditorRow(0).then((row) => {
      nameValueEquals(row, annotations[0].key, annotations[0].value);
    });
    getNameValueEditorRow(1).then((row) => {
      nameValueEquals(row, annotations[1].key, annotations[1].value);
    });
    cy.log('Update first annotation (value to empty)');
    getNameValueEditorRow(0).then((row) => {
      clearValue(row);
    });
    cy.log('Update second annotation (empty to value)');
    getNameValueEditorRow(1).then((row) => {
      setValue(row, ANNOTATION_VALUE);
    });
    cy.log('Add third annotation');
    cy.byTestID('add-button').click();
    getNameValueEditorRow(2).then((row) => {
      setName(row, ANNOTATION_KEY); // new key
      setValue(row, annotations[2].value);
    });
    modal.submit();
    modal.shouldBeClosed();

    cy.log('Verify all three annotations');
    cy.byTestID('edit-annotations').contains('3 annotations');
    detailsPage.clickPageActionFromDropdown('Edit annotations');
    modal.shouldBeOpened();
    getNameValueEditorRow(0).then((row) => {
      nameValueEquals(row, annotations[0].key, ''); // cleared 1st annotation value
    });
    getNameValueEditorRow(1).then((row) => {
      nameValueEquals(row, annotations[1].key, ANNOTATION_VALUE); // empty to updated value
    });
    getNameValueEditorRow(2).then((row) => {
      nameValueEquals(row, ANNOTATION_KEY, annotations[2].value); // new key
    });
    modal.cancel();
    modal.shouldBeClosed();

    cy.log('Delete 2nd annotation');
    detailsPage.clickPageActionFromDropdown('Edit annotations');
    modal.shouldBeOpened();
    cy.byTestID('delete-button')
      .eq(1)
      .click();
    modal.submit();
    modal.shouldBeClosed();
    cy.byTestID('edit-annotations').contains('2 annotations');
    detailsPage.clickPageActionFromDropdown('Edit annotations');
    modal.shouldBeOpened();
    cy.log('verify 2nd annotation has been removed');
    // first annotation should be the same
    getNameValueEditorRow(0).then((row) => {
      nameValueEquals(row, annotations[0].key, ''); // cleared 1st annotation value
    });
    // 2nd annotation should now have the key/value of 3rd annotation because previous 2nd annotation was deleted
    getNameValueEditorRow(1).then((row) => {
      nameValueEquals(row, ANNOTATION_KEY, annotations[2].value); // new key
    });
    cy.log('Delete all annotations');
    cy.byTestID('delete-button')
      .first()
      .click();
    cy.byTestID('delete-button').click();
    modal.submit();
    modal.shouldBeClosed();
    cy.byTestID('edit-annotations').contains('0 annotations');
  });
});
