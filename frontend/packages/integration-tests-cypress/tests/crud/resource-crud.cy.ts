import { OrderedMap } from 'immutable';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { testName, editKind, deleteKind, checkErrors } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { guidedTour } from '../../views/guided-tour';
import { listPage, ListPageSelector } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

type TestDefinition = {
  kind: string;
  namespaced?: boolean;
  humanizeKind?: boolean;
  skipYamlReloadTest?: boolean;
  skipYamlSaveTest?: boolean;
};

describe('Kubernetes resource CRUD operations', () => {
  before(() => {
    cy.login();
    guidedTour.close();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  const k8sObjs = OrderedMap<string, TestDefinition>()
    .set('secrets', { kind: 'Secret', skipYamlReloadTest: true })
    .set('cronjobs', { kind: 'CronJob', humanizeKind: false })
    .set('daemonsets', { kind: 'DaemonSet', humanizeKind: false })
    .set('deployments', { kind: 'Deployment', skipYamlReloadTest: true, skipYamlSaveTest: true });

  const openshiftObjs = OrderedMap<string, TestDefinition>().set('deploymentconfigs', {
    kind: 'DeploymentConfig',
    humanizeKind: false,
    skipYamlReloadTest: true,
    skipYamlSaveTest: true,
  });
  // .set('buildconfigs', {
  //   kind: 'BuildConfig',
  //   humanizeKind: false,
  //   skipYamlReloadTest: true,
  //   skipYamlSaveTest: true,
  // })
  // .set('imagestreams', { kind: 'ImageStream', humanizeKind: false })
  // .set('user.openshift.io~v1~Group', {
  //   kind: 'user.openshift.io~v1~Group',
  //   namespaced: false,
  // });

  const testObjs = Cypress.env('openshift') === true ? k8sObjs.merge(openshiftObjs) : k8sObjs;
  const testLabel = 'automated-test-name';
  const resourcesWithCreationForm = new Set([
    'StorageClass',
    'PersistentVolumeClaim',
    'snapshot.storage.k8s.io~v1~VolumeSnapshot',
  ]);
  const resourcesWithSyncedEditor = new Set([
    'ConfigMap',
    'DeploymentConfig',
    'Deployment',
    'BuildConfig',
  ]);

  const dataViewResources = new Set([
    'Deployment',
    'DeploymentConfig',
    'LimitRange',
    'Secret',
    'ConfigMap',
    'CronJob',
    'ResourceQuota',
    'Role',
    'ServiceAccount',
    'DaemonSet',
    'PodDisruptionBudget',
    'user.openshift.io~v1~Group',
  ]);

  testObjs.forEach((testObj, resource) => {
    const {
      kind,
      namespaced = true,
      humanizeKind = true,
      skipYamlReloadTest,
      skipYamlSaveTest,
    } = testObj;
    // Ex: to execute just the Pod crud tests, set environment var 'cypress_k8sTestResource=Pod' before running cypress
    if (Cypress.env('k8sTestResource') && kind !== Cypress.env('k8sTestResource')) {
      return;
    }
    describe(kind, () => {
      const name = `${testName}-${_.kebabCase(kind)}`;
      const isDataViewResource = dataViewResources.has(kind);

      it(`creates the resource instance`, () => {
        cy.visit(
          `${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}?name=${testName}`,
        );
        if (kind === 'Secret') {
          listPage.clickCreateYAMLdropdownButton();
        } else {
          listPage.clickCreateYAMLbutton();
        }
        if (resourcesWithCreationForm.has(kind)) {
          cy.byTestID('yaml-link').click();
        }
        if (resourcesWithSyncedEditor.has(kind)) {
          cy.byTestID('yaml-view-input').click();
        }
        // sidebar needs to be fully loaded, else it sometimes overlays the Create button
        cy.byTestID('resource-sidebar').should('exist');
        yamlEditor.isLoaded();
        cy.testA11y(`YAML Editor for ${kind}: ${name}`);
        let newContent;
        // get, update, and set yaml editor content.
        yamlEditor.getEditorContent().then((content) => {
          newContent = _.defaultsDeep(
            {},
            {
              metadata: { name, labels: { [testLabel]: testName } },
              ...(kind === 'Route'
                ? { spec: { to: { kind: 'Service', name: 'example' }, port: { targetPort: 80 } } }
                : {}),
              ...(kind === 'DeploymentConfig'
                ? {
                    spec: {
                      selector: { app: name },
                      template: { metadata: { labels: { app: name } } },
                    },
                  }
                : {}),
              ...(kind === 'BuildConfig'
                ? {
                    spec: {
                      strategy: {
                        type: 'Source',
                        sourceStrategy: {
                          from: {
                            kind: 'ImageStreamTag',
                            namespace: 'aut-form-edit-build-config',
                            name: 'nodejs-ex-git:latest',
                          },
                        },
                      },
                      source: {
                        type: 'Git',
                        git: {
                          uri: 'https://github.com/sclorg/nodejs-ex.git',
                        },
                        contextDir: '/',
                      },
                    },
                  }
                : {}),
            },
            safeLoad(content),
          );
          yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
            yamlEditor.clickSaveCreateButton();
            cy.byTestID('yaml-error').should('not.exist');
          });
        });
        detailsPage.isLoaded();
        detailsPage.titleShouldContain(name);
      });

      it('displays detail view for newly created resource instance', () => {
        cy.visit(`${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}/${name}`);
        detailsPage.isLoaded();
        detailsPage.titleShouldContain(name);
        cy.testA11y(`Details page for ${kind}: ${name}`);
        cy.testI18n([
          DetailsPageSelector.horizontalNavTabs,
          DetailsPageSelector.sectionHeadings,
          DetailsPageSelector.itemLabels,
        ]);
      });

      it(`displays a list view for the resource`, () => {
        cy.visit(
          `${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}?name=${testName}`,
        );
        if (namespaced) {
          // should have a namespace dropdown for namespaced objects');
          projectDropdown.shouldExist();
          projectDropdown.shouldContain(testName);
        } else {
          // should not have a namespace dropdown for non-namespaced objects');
          projectDropdown.shouldNotExist();
        }
        if (isDataViewResource) {
          listPage.dvRows.shouldBeLoaded();
        } else {
          listPage.rows.shouldBeLoaded();
        }
        cy.testA11y(`List page for ${kind}: ${name}`);
        cy.testI18n([ListPageSelector.tableColumnHeaders], ['item-create']);
      });

      it('search view displays created resource instance', () => {
        cy.visit(
          `/search/${
            namespaced ? `ns/${testName}` : 'all-namespaces'
          }?kind=${kind}&q=${testLabel}%3d${testName}&name=${name}`,
        );

        if (isDataViewResource) {
          listPage.dvRows.shouldExist(name);
        } else {
          listPage.rows.shouldExist(name);
        }
        cy.testA11y(`Search page for ${kind}: ${name}`);

        // link to to details page
        listPage.rows.clickRowByName(name);
        cy.url().should('include', `/${name}`);
        detailsPage.titleShouldContain(name);
      });

      it('edits the resource instance', () => {
        cy.visit(
          `/search/${
            namespaced ? `ns/${testName}` : 'all-namespaces'
          }?kind=${kind}&q=${testLabel}%3d${testName}&name=${name}`,
        );
        if (isDataViewResource) {
          listPage.dvRows.clickKebabAction(name, editKind(kind, humanizeKind));
        } else {
          listPage.rows.clickKebabAction(name, editKind(kind, humanizeKind));
        }
        if (!skipYamlReloadTest) {
          yamlEditor.isLoaded();
          yamlEditor.clickReloadButton();
        }
        if (!skipYamlSaveTest) {
          yamlEditor.clickSaveCreateButton();
        }
      });

      it(`deletes the resource instance`, () => {
        cy.visit(`${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}`);
        if (isDataViewResource) {
          listPage.dvFilter.byName(name);
          listPage.dvRows.countShouldBe(1);
          listPage.dvRows.clickKebabAction(name, deleteKind(kind, humanizeKind));
        } else {
          listPage.filter.byName(name);
          listPage.rows.countShouldBe(1);
          listPage.rows.clickKebabAction(name, deleteKind(kind, humanizeKind));
        }
        modal.shouldBeOpened();
        modal.submit();
        modal.shouldBeClosed();
        cy.resourceShouldBeDeleted(testName, resource, name);
      });
    });
  });
});
