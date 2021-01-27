import { KUBEVIRT_STORAGE_CLASS_DEFAULTS } from '../const';

export * from '../../../integration-tests-cypress/support';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      deleteResource(resource: any, ignoreNotFound?: boolean): void;
      createResource(resource: any): void;
      createDataVolume(name: string, namespace: string): void;
      dropFile(filePath: string, fileName: string, inputSelector: string): void;
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
