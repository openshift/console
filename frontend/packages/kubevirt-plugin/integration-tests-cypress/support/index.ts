import { ConfigMapKind } from '@console/internal/module/k8s';

import { V1alpha1DataVolume } from '../../src/types/api';
import { KUBEVIRT_STORAGE_CLASS_DEFAULTS } from '../const';

export * from '../../../integration-tests-cypress/support';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      deleteResource(resource: any, ignoreNotFound?: boolean): void;
      createResource(resource: any): void;
      createDataVolume(name: string, namespace: string): void;
      dropFile(filePath: string, fileName: string, inputSelector: string): void;
      createUserTemplate(namespace: string): void;
      cdiCloner(namespace: string): void;
    }
  }
}

Cypress.Commands.add('deleteResource', (resource, ignoreNotFound = true) => {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  cy.exec(
    `kubectl delete --ignore-not-found=${ignoreNotFound} -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name}`,
  );
});

Cypress.Commands.add('createResource', (resource) => {
  cy.exec(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
});

Cypress.Commands.add('createDataVolume', (name: string, namespace: string) => {
  cy.exec(
    `kubectl get -o json -n ${Cypress.env(
      'KUBEVIRT_PROJECT_NAME',
    )} configMap ${KUBEVIRT_STORAGE_CLASS_DEFAULTS}`,
  ).then((result) => {
    const configMap = JSON.parse(result.stdout);
    cy.fixture('data-volume').then((dv) => {
      dv.metadata.name = name;
      dv.metadata.namespace = namespace;
      const storageClass = Cypress.env('STORAGE_CLASS');
      dv.spec.pvc.accessModes = storageClass
        ? [configMap.data[`${storageClass}.accessMode`]]
        : [configMap.data.accessMode];
      dv.spec.pvc.volumeMode = storageClass
        ? configMap.data[`${storageClass}.volumeMode`]
        : configMap.data.volumeMode;
      if (storageClass) {
        dv.spec.pvc.storageClassName = storageClass;
      }
      cy.createResource(dv);
    });
  });
});

Cypress.Commands.add('dropFile', (filePath, fileName, inputSelector) => {
  cy.get(inputSelector).trigger('dragenter');
  cy.readFile(filePath, 'binary').then((f) => {
    const blob = Cypress.Blob.binaryStringToBlob(f);
    cy.window().then((win) => {
      const file = new win.File([blob], fileName);
      Cypress.log({ name: `${file.size}` });
      const dataTransfer = new win.DataTransfer();
      dataTransfer.items.add(file);
      cy.get(inputSelector).trigger('drop', { dataTransfer });
    });
  });
});

const configureDataVolume = (dv: V1alpha1DataVolume, configMap: ConfigMapKind) => {
  const storageClass = Cypress.env('STORAGE_CLASS');
  dv.spec.pvc.accessModes = storageClass
    ? [configMap.data[`${storageClass}.accessMode`]]
    : [configMap.data.accessMode];
  dv.spec.pvc.volumeMode = storageClass
    ? configMap.data[`${storageClass}.volumeMode`]
    : configMap.data.volumeMode;
  if (storageClass) {
    dv.spec.pvc.storageClassName = storageClass;
  }
};

Cypress.Commands.add('createUserTemplate', (namespace: string) => {
  cy.exec(
    `kubectl get -o json -n ${Cypress.env(
      'KUBEVIRT_PROJECT_NAME',
    )} configMap ${KUBEVIRT_STORAGE_CLASS_DEFAULTS}`,
  ).then((result) => {
    const configMap = JSON.parse(result.stdout);
    cy.fixture('user-template').then((ut) => {
      ut.disk0.metadata.namespace = namespace;
      configureDataVolume(ut.disk0, configMap);
      cy.createResource(ut.disk0);
      ut.disk1.metadata.namespace = namespace;
      configureDataVolume(ut.disk1, configMap);
      cy.createResource(ut.disk1);
      ut.template.objects[0].spec.dataVolumeTemplates.forEach((dv: any) => {
        configureDataVolume(dv, configMap);
        dv.spec.source.pvc.namespace = namespace;
      });
      ut.template.metadata.namespace = namespace;
      cy.createResource(ut.template);
    });
  });
});

Cypress.Commands.add('cdiCloner', (namespace: string) => {
  cy.fixture('cdi-cloner').then((cloner) => {
    cy.createResource(cloner.clusterRole);
    cloner.roleBinding.subjects[0].name = `system:serviceaccount:${namespace}:default`;
    cloner.roleBinding.metadata.name = namespace;
    cloner.roleBinding.metadata.namespace = Cypress.env('OS_IMAGES_NS');
    cy.createResource(cloner.roleBinding);
  });
});
