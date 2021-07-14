import { ConfigMapKind } from '@console/internal/module/k8s';
import { projectDropdown } from '../../../integration-tests-cypress/views/common';
import { V1alpha1DataVolume } from '../../src/types/api';
import {
  KUBEVIRT_PROJECT_NAME,
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  EXPECT_LOGIN_SCRIPT_PATH,
} from '../const';
import { VirtualMachineData } from '../types/vm';

export * from '../../../integration-tests-cypress/support';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      deleteResource(resource: any, ignoreNotFound?: boolean): void;
      applyResource(resource: any): void;
      createResource(resource: any): void;
      waitForResource(resource: any): void;
      createDataVolume(name: string, namespace: string): void;
      dropFile(filePath: string, fileName: string, inputSelector: string): void;
      createUserTemplate(namespace: string): void;
      cdiCloner(srcNS: string, destNS: string): void;
      waitForLoginPrompt(vmName: string, namespace: string): void;
      Login(): void;
      deleteTestProject(namespace: string): void;
      pauseVM(vmData: VirtualMachineData): void;
      uploadFromCLI(dvName: string, ns: string, imagePath: string, size: string): void;
      selectProject(project: string): void;
      createNAD(namespace: string): void;
    }
  }
}

Cypress.Commands.add('deleteResource', (resource, ignoreNotFound = true) => {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  cy.exec(
    `kubectl delete --ignore-not-found=${ignoreNotFound} -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name} --wait=true --timeout=120s`,
  );

  // VMI may still be there while VM is being deleted. Wait for VMI to be deleted before continuing
  if (['VirtualMachine', 'DataVolume', 'PersistentVolumeClaim'].includes(kind)) {
    cy.exec(
      `kubectl delete --ignore-not-found=${ignoreNotFound} -n ${resource.metadata.namespace} vmi ${resource.metadata.name} --wait=true --timeout=120s`,
    );
  }
});

Cypress.Commands.add('createResource', (resource) => {
  cy.exec(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
});

Cypress.Commands.add('applyResource', (resource) => {
  cy.exec(`echo '${JSON.stringify(resource)}' | kubectl apply -f -`);
});

Cypress.Commands.add('waitForResource', (resource: any) => {
  const { kind } = resource;
  const { name } = resource.metadata;
  const ns = resource.metadata.namespace;
  cy.exec(`kubectl wait --for condition=Ready ${kind} ${name} -n ${ns} --timeout=600s`, {
    timeout: 600000,
  });
});

Cypress.Commands.add('createDataVolume', (name: string, namespace: string) => {
  cy.exec(
    `kubectl get -o json -n ${KUBEVIRT_PROJECT_NAME} configMap ${KUBEVIRT_STORAGE_CLASS_DEFAULTS}`,
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
      cy.applyResource(dv);
      cy.waitForResource(dv);
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
    `kubectl get -o json -n ${KUBEVIRT_PROJECT_NAME} configMap ${KUBEVIRT_STORAGE_CLASS_DEFAULTS}`,
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

Cypress.Commands.add('cdiCloner', (srcNS: string, destNS: string) => {
  cy.fixture('cdi-cloner').then((cloner) => {
    cy.applyResource(cloner.clusterRole);
    cloner.roleBinding.subjects[0].namespace = destNS;
    cloner.roleBinding.metadata.namespace = srcNS;
    cy.applyResource(cloner.roleBinding);
  });
});

Cypress.Commands.add('waitForLoginPrompt', (vmName: string, namespace: string) => {
  cy.exec(`expect ${EXPECT_LOGIN_SCRIPT_PATH} ${vmName} ${namespace}`, {
    failOnNonZeroExit: false,
    timeout: 600000,
  });
});

Cypress.Commands.add('Login', () => {
  if (Cypress.env('IDP')) {
    cy.login(Cypress.env('IDP'), Cypress.env('IDP_USERNAME'), Cypress.env('IDP_PASSWORD'));
  } else {
    cy.login();
  }
});

Cypress.Commands.add('deleteTestProject', (namespace: string) => {
  cy.exec(`oc delete project ${namespace}`);
});

Cypress.Commands.add('pauseVM', (vmData: VirtualMachineData) => {
  const { name, namespace } = vmData;
  cy.exec(`virtctl pause vm ${name} -n ${namespace}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

Cypress.Commands.add(
  'uploadFromCLI',
  (dvName: string, ns: string, imagePath: string, size: string) => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.exec(
        `virtctl image-upload dv ${dvName} --image-path=${imagePath} --size=${size}Gi --storage-class=ocs-storagecluster-ceph-rbd --access-mode=ReadWriteMany --block-volume -n ${ns} --insecure || true`,
      );
    }
    if (Cypress.env('STORAGE_CLASS') === 'hostpath-provisioner') {
      cy.exec(
        `virtctl image-upload dv ${dvName} --image-path=${imagePath} --size=${size}Gi --storage-class=hostpath-provisioner --access-mode=ReadWriteOnce -n ${ns} --insecure || true`,
      );
    }
  },
);

Cypress.Commands.add('selectProject', (project: string) => {
  projectDropdown.selectProject(project);
  projectDropdown.shouldContain(project);
});

Cypress.Commands.add('createNAD', (namespace: string) => {
  cy.fixture('nad').then((nad) => {
    nad.metadata.namespace = namespace;
    cy.createResource(nad);
  });
});
