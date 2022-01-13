import { projectDropdown } from '../../../integration-tests-cypress/views/common';
import nadFixture from '../fixtures/nad';
import { VirtualMachineData } from '../types/vm';
import {
  EXPECT_LOGIN_SCRIPT_PATH,
  K8S_KIND,
  KUBEVIRT_PROJECT_NAME,
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
} from '../utils/const/index';
import './virtualization';
import { tour, Perspective, switchPerspective } from '../views/dev-perspective';

export * from '../../../integration-tests-cypress/support';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      deleteResource(kind: string, name: string, namespace?: string): void;
      applyResource(resource: any): void;
      createResource(resource: any): void;
      waitForResource(resource: any): void;
      createDataVolume(name: string, namespace: string): void;
      dropFile(filePath: string, fileName: string, inputSelector: string): void;
      cdiCloner(srcNS: string, destNS: string): void;
      Login(): void;
      deleteTestProject(namespace: string): void;
      pauseVM(vmData: VirtualMachineData): void;
      uploadFromCLI(dvName: string, ns: string, imagePath: string, size: string): void;
      selectProject(project: string): void;
      createNAD(namespace: string): void;
      waitForLoginPrompt(vmName: string, namespace: string): void;
      visitNADPage(): void;
    }
  }
}

Cypress.Commands.add('deleteResource', (kind: string, name: string, namespace?: string) => {
  // If cluster resource, ommit namespace
  if (!namespace) {
    cy.exec(
      `kubectl delete --ignore-not-found=true --cascade ${kind} ${name} --wait=true --timeout=180s || true`,
      { timeout: 180000 },
    );
    return;
  }

  cy.exec(
    `kubectl delete --ignore-not-found=true -n ${namespace} --cascade ${kind} ${name} --wait=true --timeout=120s || true`,
    { timeout: 120000 },
  );

  if (kind === K8S_KIND.VM) {
    // VMI may still be there while VM is being deleted. Wait for VMI to be deleted before continuing
    cy.exec(
      `kubectl delete --ignore-not-found=true -n ${namespace} vmi ${name} --wait=true --timeout=240s || true`,
      { timeout: 240000 },
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
  cy.exec(`kubectl wait --for condition=Ready ${kind} ${name} -n ${ns} --timeout=600s || true`, {
    timeout: 600000,
  });
});

Cypress.Commands.add('createDataVolume', (name: string, namespace: string) => {
  const execCommand = (project: string) =>
    `kubectl get -o json -n ${project} configMap ${KUBEVIRT_STORAGE_CLASS_DEFAULTS}`;

  const createDataVolume = (configMap) => {
    cy.fixture('data-volume').then((dv) => {
      dv.metadata.name = name;
      dv.metadata.namespace = namespace;
      const storageClass = Cypress.env('STORAGE_CLASS');
      dv.spec.pvc.accessModes = (configMap.data[`${storageClass}.accessMode`] && [
        configMap.data[`${storageClass}.accessMode`],
      ]) ||
        (configMap.data.accessMode && [configMap.data.accessMode]) || ['ReadWriteOnce'];
      dv.spec.pvc.volumeMode =
        configMap.data[`${storageClass}.volumeMode`] || configMap.data.volumeMode || 'Filesystem';
      if (storageClass) {
        dv.spec.pvc.storageClassName = storageClass;
      }
      cy.applyResource(dv);
      cy.waitForResource(dv);
    });
  };

  cy.exec(execCommand(KUBEVIRT_PROJECT_NAME)).then((result) => {
    result?.stdout && createDataVolume(JSON.parse(result?.stdout));
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

Cypress.Commands.add('cdiCloner', (srcNS: string, destNS: string) => {
  cy.fixture('cdi-cloner').then((cloner) => {
    cy.applyResource(cloner.clusterRole);
    cloner.roleBinding.subjects[0].namespace = destNS;
    cloner.roleBinding.metadata.namespace = srcNS;
    cy.applyResource(cloner.roleBinding);
  });
});

Cypress.Commands.add('Login', () => {
  if (Cypress.env('IDP')) {
    cy.login(Cypress.env('IDP'), Cypress.env('IDP_USERNAME'), Cypress.env('IDP_PASSWORD'));
    // skip tour
    cy.get('body').then(($body) => {
      if ($body.find(tour).length) {
        cy.get(tour).click();
        switchPerspective(Perspective.Administrator);
      }
    });
  } else {
    cy.login();
  }
});

Cypress.Commands.add('deleteTestProject', (namespace: string) => {
  cy.exec(`oc delete --ignore-not-found=true project ${namespace}`);
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
        `virtctl image-upload dv ${dvName} --image-path=${imagePath} --size=${size}Gi --storage-class=hostpath-csi --access-mode=ReadWriteOnce -n ${ns} --insecure || true`,
      );
    }
  },
);

Cypress.Commands.add('selectProject', (project: string) => {
  projectDropdown.selectProject(project);
  projectDropdown.shouldContain(project);
});

Cypress.Commands.add('createNAD', (namespace: string) => {
  nadFixture.metadata.namespace = namespace;
  cy.createResource(nadFixture);
});

Cypress.Commands.add('waitForLoginPrompt', (vmName: string, namespace: string) => {
  cy.exec(`expect ${EXPECT_LOGIN_SCRIPT_PATH} ${vmName} ${namespace}`, {
    failOnNonZeroExit: false,
    timeout: 600000,
  });
});

Cypress.Commands.add('visitNADPage', () => {
  cy.clickNavLink(['Networking', 'NetworkAttachmentDefinitions']);
});
