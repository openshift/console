import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  HandlePromiseProps,
  withHandlePromise,
  Dropdown,
  convertToBaseValue,
  Firehose,
} from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory';
import { k8sPatch, TemplateKind } from '@console/internal/module/k8s';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { VMLikeEntityKind } from '../../../types/vmLike';
import {
  getFlavor,
  getMemory,
  getCPU,
  vCPUCount,
  asVM,
  getVMLikeModel,
} from '../../../selectors/vm';
import { getFlavors } from '../../../selectors/vm-template/selectors';
import { getUpdateFlavorPatches } from '../../../k8s/patches/vm/vm-patches';
import {
  CUSTOM_FLAVOR,
  NAMESPACE_OPENSHIFT,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_BASE,
} from '../../../constants';
import { getResource } from '../../../utils';
import './_vm-flavor-modal.scss';

const Gi = 1024 ** 3;

const getId = (field: string) => `vm-flavor-modal-${field}`;
const dehumanizeMemory = (memory?: string) => {
  if (!memory) {
    return null;
  }

  return convertToBaseValue(memory) / Gi;
};

const VMFlavorModal = withHandlePromise((props: VMFlavornModalProps) => {
  const {
    vmLike,
    templates,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
    loadError,
    loaded,
  } = props;
  const vm = asVM(vmLike);
  const flattenTemplates = _.get(templates, 'data', []) as TemplateKind[];

  const vmFlavor = getFlavor(vmLike);
  const flavors = getFlavors(vmLike, flattenTemplates);

  const sourceMemory = getMemory(vm);

  const sourceCPURaw = getCPU(vm);
  const sourceCPU = vCPUCount(sourceCPURaw);

  const [flavor, setFlavor] = React.useState(vmFlavor);
  const [mem, setMem] = React.useState(
    vmFlavor === CUSTOM_FLAVOR ? dehumanizeMemory(sourceMemory) : 1,
  );
  const [cpu, setCpu] = React.useState(vmFlavor === CUSTOM_FLAVOR ? sourceCPU : 1);

  const submit = (e) => {
    e.preventDefault();

    const patches = getUpdateFlavorPatches(vmLike, flattenTemplates, flavor, cpu, `${mem}Gi`);
    if (patches.length === 0) {
      close();
    } else {
      const promise = k8sPatch(getVMLikeModel(vmLike), vmLike, patches);
      handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
    }
  };

  const topClass = classNames('modal-content', {
    'kubevirt-vm-flavor-modal__content-custom': flavor === CUSTOM_FLAVOR,
    'kubevirt-vm-flavor-modal__content-generic': flavor !== CUSTOM_FLAVOR,
  });

  return (
    <div className={topClass}>
      <ModalTitle>Edit Flavor</ModalTitle>
      <ModalBody>
        <Form onSubmit={submit} className="kubevirt-vm-flavor-modal__form" isHorizontal>
          <FormGroup label="Flavor" fieldId={getId('flavor')}>
            <Dropdown
              items={flavors}
              id={getId('flavor-dropdown')}
              onChange={(f) => setFlavor(f)}
              selectedKey={_.capitalize(flavor) || CUSTOM_FLAVOR}
              title={_.capitalize(flavor)}
              className="kubevirt-vm-flavor-modal__dropdown"
              buttonClassName="kubevirt-vm-flavor-modal__dropdown-button"
            />
          </FormGroup>

          {flavor === CUSTOM_FLAVOR && (
            <>
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
              <FormGroup label="Memory (Gi)" isRequired fieldId={getId('memory')}>
                <TextInput
                  isRequired
                  type="number"
                  id={getId('memory')}
                  value={mem}
                  onChange={(v) => setMem(parseInt(v, 10) || 1)}
                  aria-label="Memory"
                />
              </FormGroup>
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        inProgress={inProgress || !loaded}
        errorMessage={errorMessage || _.get(loadError, 'message')}
      >
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

const VMFlavorModalFirehose = (props) => {
  const resources = [
    getResource(TemplateModel, {
      namespace: NAMESPACE_OPENSHIFT,
      prop: 'templates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    }),
  ];

  return (
    <Firehose resources={resources}>
      <VMFlavorModal {...props} />
    </Firehose>
  );
};

export type VMFlavornModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLike: VMLikeEntityKind;
    templates?: any;
    loadError?: any;
    loaded: boolean;
  };

export const vmFlavorModal = createModalLauncher(VMFlavorModalFirehose);
