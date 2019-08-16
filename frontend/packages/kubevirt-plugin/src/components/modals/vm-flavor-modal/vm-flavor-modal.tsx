import * as React from 'react';
import { getVmTemplate } from 'kubevirt-web-ui-components';
import {
  HandlePromiseProps,
  withHandlePromise,
  Dropdown,
  convertToBaseValue,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory';
import { k8sPatch, TemplateKind } from '@console/internal/module/k8s';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { VMKind } from '../../../types';
import {
  getFlavor,
  getMemory,
  getCPU,
  getOperatingSystem,
  getWorkloadProfile,
} from '../../../selectors/vm';
import { getUpdateFlavorPatches } from '../../../k8s/patches/vm/vm-patches';
import { VirtualMachineModel } from '../../../models';
import { CUSTOM_FLAVOR } from '../../../constants';
import { getTemplateFlavors, getTemplates } from '../../../selectors/vm-template/selectors';

import './_vm-flavor-modal.scss';

const MB = 1000 ** 2;

const getId = (field: string) => `vm-flavor-modal-${field}`;
const dehumanizeMemory = (memory?: string) => {
  if (!memory) {
    return null;
  }

  return convertToBaseValue(memory) / MB;
};

const getFlavors = (vm: VMKind, templates: TemplateKind[]) => {
  const vmTemplate = getVmTemplate(vm);

  const flavors = {
    // always listed
    [CUSTOM_FLAVOR]: CUSTOM_FLAVOR,
  };

  if (vmTemplate) {
    // enforced by the vm
    const templateFlavors = getTemplateFlavors([vmTemplate]);
    templateFlavors.forEach((f) => (flavors[f] = f));
  }

  // if VM OS or Workload is set, add flavors of matching templates only. Otherwise list all flavors.
  const vmOS = getOperatingSystem(vm);
  const vmWorkload = getWorkloadProfile(vm);
  const matchingTemplates = getTemplates(templates, vmOS, vmWorkload, undefined);
  const templateFlavors = getTemplateFlavors(matchingTemplates);
  templateFlavors.forEach((f) => (flavors[f] = f));

  return flavors;
};

const getTemplate = (templates: TemplateKind[], vm: VMKind, flavor: string) => {
  const vmOS = getOperatingSystem(vm);
  const vmWorkload = getWorkloadProfile(vm);
  const matchingTemplates = getTemplates(templates, vmOS, vmWorkload, flavor);

  // Take first matching. If OS/Workloads changes in the future, there will be another patch sent
  return matchingTemplates.length > 0 ? matchingTemplates[0] : undefined;
};

export const VMFlavorModal = withHandlePromise((props: VMFlavornModalProps) => {
  const { vm, templates, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const vmFlavor = getFlavor(vm);
  const [flavor, setFlavor] = React.useState(vmFlavor);
  const [mem, setMem] = React.useState(
    vmFlavor === CUSTOM_FLAVOR ? dehumanizeMemory(getMemory(vm)) : 1,
  );
  const [cpu, setCpu] = React.useState(vmFlavor === CUSTOM_FLAVOR ? getCPU(vm) : 1);

  const flavors = getFlavors(vm, templates);

  const submit = (e) => {
    e.preventDefault();

    const patches = getUpdateFlavorPatches(
      vm,
      getTemplate(templates, vm, flavor),
      flavor,
      cpu,
      `${mem}M`,
    );
    if (patches.length === 0) {
      close();
    } else {
      const promise = k8sPatch(VirtualMachineModel, vm, patches);
      handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
    }
  };

  return (
    <div className="modal-content kubevirt-vm-flavor-modal__content">
      <ModalTitle>Edit Flavor</ModalTitle>
      <ModalBody>
        <Form onSubmit={submit} className="kubevirt-vm-flavor-modal__form" isHorizontal>
          <FormGroup label="Flavor" fieldId={getId('flavor')}>
            <Dropdown
              items={flavors}
              onChange={(f) => setFlavor(f)}
              selectedKey={flavor || CUSTOM_FLAVOR}
              title={flavor}
              className="kubevirt-vm-flavor-modal__dropdown"
              buttonClassName="kubevirt-vm-flavor-modal__dropdown-button"
            />
          </FormGroup>

          {flavor === CUSTOM_FLAVOR && (
            <React.Fragment>
              <FormGroup label="CPUs" isRequired fieldId={getId('cpu')}>
                <TextInput
                  isRequired
                  type="number"
                  id={getId('cpu')}
                  value={cpu}
                  onChange={(v) => setCpu(parseInt(v, 10) || 1)}
                  aria-label="CPU count"
                />
              </FormGroup>
              <FormGroup label="Memory (MB)" isRequired fieldId={getId('memory')}>
                <TextInput
                  isRequired
                  type="number"
                  id={getId('memory')}
                  value={mem}
                  onChange={(v) => setMem(parseInt(v, 10) || 1)}
                  aria-label="Memory"
                />
              </FormGroup>
            </React.Fragment>
          )}
        </Form>
      </ModalBody>
      <ModalFooter inProgress={inProgress} errorMessage={errorMessage}>
        <button type="button" onClick={cancel} className="btn btn-default">
          Cancel
        </button>
        <button type="button" onClick={submit} className="btn btn-primary" id="confirm-action">
          Save
        </button>
      </ModalFooter>
    </div>
  );
});

export type VMFlavornModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vm: VMKind;
    templates: TemplateKind[];
  };

export const vmFlavorModal = createModalLauncher(VMFlavorModal);
