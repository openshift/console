import * as React from 'react';
import * as _ from 'lodash';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { k8sPatch, TemplateKind } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types/vmLike';
import {
  asVM,
  getCPU,
  getFlavor,
  getMemory,
  getVMLikeModel,
  vCPUCount,
  isVMRunningOrExpectedRunning,
} from '../../../selectors/vm';
import { getUpdateFlavorPatches } from '../../../k8s/patches/vm/vm-patches';
import { CUSTOM_FLAVOR } from '../../../constants';
import { getLoadedData } from '../../../utils';
import { SizeUnitFormRow } from '../../form/size-unit-form-row';
import { BinaryUnit, stringValueUnitSplit } from '../../form/size-unit-utils';
import { ModalFooter } from '../modal/modal-footer';
import { FormRow } from '../../form/form-row';
import { Integer } from '../../form/integer/integer';
import { validateFlavor } from '../../../utils/validations/vm/flavor';
import { isValidationError } from '../../../utils/validations/common';
import { useShowErrorToggler } from '../../../hooks/use-show-error-toggler';
import { getDialogUIError } from '../../../utils/strings';
import { flavorSort } from '../../../utils/sort';
import { getTemplateFlavors } from '../../../selectors/vm-template/advanced';
import { getVMTemplateNamespacedName } from '../../../selectors/vm-template/selectors';
import { toUIFlavor, isCustomFlavor } from '../../../selectors/vm-like/flavor';
import { PendingChangesAlert } from '../../../selectors/vm-like/nextRunChanges';
import { restartVM, VMActionType } from '../../../k8s/requests/vm/actions';
import { confirmVMIModal } from '../menu-actions-modals/confirm-vmi-modal';
import { getActionMessage } from '../../vms/constants';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';

const getId = (field: string) => `vm-flavor-modal-${field}`;

const getAvailableFlavors = (template: TemplateKind) => {
  const flavors = getTemplateFlavors([template]).filter((f) => f && !isCustomFlavor(f));
  flavors.push(CUSTOM_FLAVOR);

  return _.uniq(flavorSort(flavors));
};

const VMFlavorModal = withHandlePromise((props: VMFlavornModalProps) => {
  const { vmLike, template, errorMessage, handlePromise, close, cancel, loadError, loaded } = props;

  const inProgress = props.inProgress || !loaded;
  const vm = asVM(vmLike);
  const underlyingTemplate = getLoadedData(template);
  const { vmi } = React.useContext(VMDashboardContext);

  const flavors = getAvailableFlavors(underlyingTemplate);
  const vmFlavor = toUIFlavor(getFlavor(vmLike) || flavors[flavors.length - 1]);

  const [sourceMemSize, sourceMemUnit] = stringValueUnitSplit(getMemory(vm) || '');
  const sourceCPURaw = getCPU(vm);
  const sourceCPU = vCPUCount(sourceCPURaw);

  const [flavor, setFlavor] = React.useState(vmFlavor);
  const isCustom = isCustomFlavor(flavor);

  const [memSize, setMemSize] = React.useState<string>(isCustom ? sourceMemSize || '' : '');
  const [memUnit, setMemUnit] = React.useState<string>(
    isCustom ? sourceMemUnit || BinaryUnit.Gi : BinaryUnit.Gi,
  );
  const [cpus, setCpus] = React.useState<string>(isCustom ? `${sourceCPU}` : '');

  const {
    validations: { cpus: cpusValidation, memory: memoryValidation },
    hasAllRequiredFilled,
    isValid,
  } = validateFlavor(
    { cpus, memory: { size: memSize, unit: memUnit } },
    { isCustomFlavor: isCustom },
  );

  const [showUIError, setShowUIError] = useShowErrorToggler(false, isValid, isValid);

  const saveChanges = () => {
    if (isValid) {
      const patches = getUpdateFlavorPatches(
        vmLike,
        underlyingTemplate,
        flavor,
        parseInt(cpus, 10),
        `${memSize}${memUnit}`,
      );
      if (patches.length > 0) {
        const promise = k8sPatch(getVMLikeModel(vmLike), vmLike, patches);
        handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
      } else {
        close();
      }
    } else {
      setShowUIError(true);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    saveChanges();
  };

  return (
    <div className="modal-content">
      <ModalTitle>Edit Flavor</ModalTitle>
      <ModalBody>
        {isVMRunningOrExpectedRunning(vm) && <PendingChangesAlert />}
        <Form>
          <FormRow title="Flavor" fieldId={getId('flavor')} isRequired>
            <FormSelect
              onChange={(f) => {
                if (isCustomFlavor(f)) {
                  const isSourceCustom = isCustomFlavor(vmFlavor);
                  setMemSize(isSourceCustom ? sourceMemSize || '' : '');
                  setMemUnit(isSourceCustom ? sourceMemUnit || BinaryUnit.Gi : BinaryUnit.Gi);
                  setCpus(isSourceCustom ? `${sourceCPU}` : '');
                }
                setFlavor(f);
              }}
              value={flavor}
              id={getId('flavor')}
              isDisabled={inProgress}
            >
              {flavors.map((f) => (
                <FormSelectOption key={f} value={f} label={_.capitalize(f)} />
              ))}
            </FormSelect>
          </FormRow>

          {isCustom && (
            <>
              <FormRow
                key="cpu"
                title="CPUs"
                fieldId={getId('cpu')}
                isRequired
                validation={cpusValidation}
              >
                <Integer
                  isValid={!isValidationError(cpusValidation)}
                  isDisabled={inProgress}
                  id={getId('cpu')}
                  value={cpus}
                  isPositive
                  onChange={(v) => setCpus(v)}
                  isFullWidth
                  aria-label="CPU count"
                />
              </FormRow>
              <SizeUnitFormRow
                title="Memory"
                key="memory"
                id={getId('memory')}
                size={memSize}
                unit={memUnit as BinaryUnit}
                units={[BinaryUnit.Mi, BinaryUnit.Gi, BinaryUnit.Ti]}
                validation={memoryValidation}
                isDisabled={inProgress}
                isRequired
                onSizeChanged={setMemSize}
                onUnitChanged={setMemUnit}
              />
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        id="vm-flavor-modal"
        errorMessage={
          errorMessage ||
          loadError?.message ||
          (showUIError ? getDialogUIError(hasAllRequiredFilled) : null)
        }
        isSimpleError={showUIError}
        isDisabled={inProgress}
        inProgress={inProgress}
        isSaveAndRestart={isVMRunningOrExpectedRunning(vm)}
        onSubmit={submit}
        submitButtonText="Save"
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
        onSaveAndRestart={() => {
          confirmVMIModal({
            vmi,
            title: 'Restart Virtual Machine',
            alertTitle: 'Restart Virtual Machine alert',
            message: getActionMessage(vm, VMActionType.Restart),
            btnText: _.capitalize(VMActionType.Restart),
            executeFn: () => {
              saveChanges();
              return restartVM(vm);
            },
            cancel: () => saveChanges(),
          });
        }}
      />
    </div>
  );
});

const VMFlavorModalFirehose = (props) => {
  const { vmLike } = props;
  const resources = [];
  const underlyingTemplate = getVMTemplateNamespacedName(vmLike);

  if (underlyingTemplate) {
    resources.push({
      kind: TemplateModel.kind,
      model: TemplateModel,
      name: underlyingTemplate.name,
      namespace: underlyingTemplate.namespace,
      isList: false,
      prop: 'template',
    });
  }

  return (
    <Firehose resources={resources}>
      <VMFlavorModal {...props} />
    </Firehose>
  );
};

export type VMFlavornModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLike: VMLikeEntityKind;
    template?: FirehoseResult<TemplateKind>;
    loadError?: any;
    loaded: boolean;
  };

export const vmFlavorModal = createModalLauncher(VMFlavorModalFirehose);
