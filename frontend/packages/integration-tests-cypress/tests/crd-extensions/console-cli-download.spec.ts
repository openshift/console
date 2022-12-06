import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

const crd = 'ConsoleCLIDownload';

describe(`${crd} CRD`, () => {
  const name = `${testName}-ccd`;
  // cannot use default YAML template since it contains new lines
  // in the description and that breaks with safeLoad
  const crdObj = {
    apiVersion: 'console.openshift.io/v1',
    kind: crd,
    metadata: {
      name,
    },
    spec: {
      displayName: name,
      description:
        'This is an example CLI download description that can include markdown such as paragraphs, unordered lists, code, [links](https://www.example.com), etc.',
      links: [{ href: 'https://www.example.com', text: 'Example CLI Download' }],
    },
  };

  before(() => {
    cy.login();
    cy.visit('/');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it(`creates, displays, and deletes a new ${crd} instance`, () => {
    cy.visit(`/k8s/cluster/customresourcedefinitions?custom-resource-definition-name=${crd}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(crd, 'View instances');
    listPage.titleShouldHaveText(crd);
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, crdObj, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.get(errorMessage).should('not.exist');
      });
    });

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}`);
    detailsPage.titleShouldContain(name);

    cy.visit(`/command-line-tools`);
    cy.get(`[data-test-id=${name}]`).should('contain', name);

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(name, `Delete ${crd}`);
    modal.shouldBeOpened();
    modal.modalTitleShouldContain(`Delete ${crd}`);
    modal.submit();
    modal.shouldBeClosed();
  });
});
