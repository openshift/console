import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

const crd = 'ConsoleLink';

describe(`${crd} CRD`, () => {
  const name = `${testName}-cl`;
  const testObjs = [
    {
      name,
      dropdownMenuName: 'help menu',
      dropdownToggle: '[data-test=help-dropdown-toggle] .pf-c-app-launcher__toggle',
      menuLinkLocation: 'HelpMenu',
      menuLinkText: `${name} help menu link`,
    },
    {
      name,
      dropdownMenuName: 'user menu',
      dropdownToggle: '[data-test=user-dropdown] .pf-c-app-launcher__toggle',
      menuLinkLocation: 'UserMenu',
      menuLinkText: `${name} user menu link`,
    },
  ];

  before(() => {
    cy.login();
    cy.visit('/');
  });

  afterEach(() => {
    // delete potential orphaned consolelink from possible failed try
    cy.exec(`oc delete consolelink ${name}`, {
      failOnNonZeroExit: false,
    });
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  testObjs.forEach(
    ({ name: instanceName, dropdownMenuName, dropdownToggle, menuLinkLocation, menuLinkText }) => {
      it(`creates, displays, and deletes a new ${crd} ${dropdownMenuName} instance`, () => {
        cy.visit(`/k8s/cluster/customresourcedefinitions?custom-resource-definition-name=${crd}`);
        listPage.rows.shouldBeLoaded();
        listPage.rows.clickKebabAction(crd, 'View instances');
        listPage.titleShouldHaveText(crd);
        listPage.clickCreateYAMLbutton();
        yamlEditor.isLoaded();
        yamlEditor.getEditorContent().then((content) => {
          const newContent = _.defaultsDeep(
            {},
            {
              metadata: { name: instanceName },
              spec: { location: menuLinkLocation, text: menuLinkText },
            },
            safeLoad(content),
          );
          yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
            yamlEditor.clickSaveCreateButton();
            cy.get(errorMessage).should('not.exist');
          });
        });

        cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}`);
        detailsPage.sectionHeaderShouldExist('ConsoleLink details');
        detailsPage.titleShouldContain(name);

        cy.get(dropdownToggle).click();
        cy.get('.pf-c-app-launcher__menu')
          .find('[data-test="application-launcher-item"]')
          .contains(menuLinkText)
          .should('exist');

        cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}`);
        listPage.rows.shouldBeLoaded();
        listPage.rows.clickKebabAction(name, `Delete ${crd}`);
        modal.shouldBeOpened();
        modal.modalTitleShouldContain(`Delete ${crd}`);
        modal.submit();
        modal.shouldBeClosed();
      });
    },
  );
});
