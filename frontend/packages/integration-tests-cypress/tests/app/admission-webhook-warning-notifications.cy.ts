import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import * as yamlEditor from '../../views/yaml-editor';

const POD_NAME = 'pod1';
const DEPLOY_NAME = 'deploy1';
const CONTAINER_NAME = 'container1';
const WARNING_FOO = '299 - "[pod-must-have-label-foo] you must provide labels: {"foo"}"';
const WARNING_BAR = '299 - "[deployment-must-have-label-bar] you must provide labels: {"bar"}"';
const WAIT_OPTION = { requestTimeout: 5000 };
const POD_CREATED_ALIAS = 'podCreated';
const BULK_RESOURCES_CREATED_ALIAS = 'bulkResourcesCreated';
const LEARN_MORE_ID = 'admission-webhook-warning-learn-more';
const WARNING_ID = 'admission-webhook-warning';
const resources = [
  { kind: 'Pod', name: `${POD_NAME}-b`, warning: WARNING_FOO, resource: 'pods', path: 'api' },
  {
    kind: 'Deployment',
    name: DEPLOY_NAME,
    warning: WARNING_BAR,
    resource: 'deployments',
    path: 'apis/apps',
  },
];
const pod1ReqObj = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-a
  labels:
    app: httpd
  namespace: ${testName}
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name:  ${CONTAINER_NAME}
      image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest'
      ports:
        - containerPort: 8080
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL`;

const bulkResourcesReqObj = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-b
  labels:
    app: httpd
  namespace: ${testName}
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name:  ${CONTAINER_NAME}
      image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest'
      ports:
        - containerPort: 8080
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
---           
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${DEPLOY_NAME}
  annotations: {}
  namespace: ${testName}
spec:
  selector:
    matchLabels:
      app: deploy1
  replicas: 3
  template:
    metadata:
      labels:
        app: deploy1
    spec:
      containers:
        - name: ${CONTAINER_NAME}
          image: >-
            image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
          ports:
            - containerPort: 8080
              protocol: TCP
          env:
            - name: app
              value: frontennd
      imagePullSecrets: []
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  paused: false
`;

describe('Admission Webhook warning notification', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
    cy.deleteProjectWithCLI(testName);
  });

  it('Create a pod and display Admission Webhook warning notification', () => {
    cy.visit(`/k8s/ns/${testName}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(pod1ReqObj).then(() => {
      cy.intercept('POST', `/api/kubernetes/api/v1/namespaces/${testName}/pods`, (req) => {
        req.continue((res) => {
          res.headers = {
            Warning: WARNING_FOO,
          };
        });
      }).as(POD_CREATED_ALIAS);
      yamlEditor.clickSaveCreateButton();
      cy.wait(`@${POD_CREATED_ALIAS}`, WAIT_OPTION);
      detailsPage.sectionHeaderShouldExist('Pod details');
      cy.byTestID(WARNING_ID).contains('Admission Webhook Warning');
      cy.byTestID(WARNING_ID).contains(`Pod ${POD_NAME}-a violates policy ${WARNING_FOO}`);
      cy.byTestID(LEARN_MORE_ID).contains('Learn more').click();
    });
  });

  it('Create bulk resources and display Admission Webhook warning notifications', () => {
    cy.visit(`/k8s/ns/${testName}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(bulkResourcesReqObj).then(() => {
      for (const resource of resources) {
        cy.intercept(
          'POST',
          `/api/kubernetes/${resource.path}/v1/namespaces/${testName}/${resource.resource}`,
          (req) => {
            req.continue((res) => {
              res.headers = {
                Warning: resource.warning,
              };
            });
          },
        ).as(BULK_RESOURCES_CREATED_ALIAS);
      }
      yamlEditor.clickSaveCreateButton();
      cy.wait(`@${BULK_RESOURCES_CREATED_ALIAS}`, WAIT_OPTION);
      cy.byTestID('resources-successfully-created').contains('Resources successfully created');
      cy.byTestID(WARNING_ID).contains('Admission Webhook Warning');
      cy.byTestID(WARNING_ID).contains(`Pod ${POD_NAME}-b violates policy ${WARNING_FOO}`);
      cy.byTestID(WARNING_ID).contains(`Deployment ${DEPLOY_NAME} violates policy ${WARNING_BAR}`);
      cy.byTestID(LEARN_MORE_ID).contains('Learn more').click();
    });
  });
});
