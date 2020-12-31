import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { useAccessReview2 } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { StorageClassModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VMImportProvider, VMWareProviderField, VMWareProviderProps } from '../../../../types';
import { iGetVMWareField } from '../../../../selectors/immutable/provider/vmware/selectors';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormFieldRow } from '../../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormSelectPlaceholderOption } from '../../../../../form/form-select-placeholder-option';
import { getPlaceholderKey } from '../../../../utils/renderable-field-utils';
import { ignoreCaseSort } from '../../../../../../utils/sort';
import { requestVmDetails } from '../../../../redux/state-update/providers/vmware/vmware-provider-actions';
import { getDefaultStorageClass } from '../../../../../../selectors/config-map/sc-defaults';

const VMWareVMsConnected: React.FC<VMWareVMsConnectedProps> = React.memo(
  ({ vmField, v2vvmware, onVMChange }) => {
    const { t } = useTranslation();
    const iVMs = iGetIn(v2vvmware, ['data', 'spec', 'vms']);
    let vmNames;
    if (iVMs) {
      vmNames = ignoreCaseSort(
        iVMs
          .map((vm) => vm.get('name'))
          .toSetSeq()
          .toArray(),
      );
    }

    const [scAllowed] = useAccessReview2({
      group: StorageClassModel.apiGroup,
      resource: StorageClassModel.plural,
      verb: 'list',
    });
    const [storageClasses] = useK8sWatchResource<StorageClassResourceKind[]>(
      scAllowed
        ? {
            kind: StorageClassModel.kind,
            isList: true,
            namespaced: false,
          }
        : null,
    );

    const defaultStorageClass =
      scAllowed && (getDefaultStorageClass(storageClasses) || storageClasses?.[0]);

    return (
      <FormFieldRow field={vmField} fieldType={FormFieldType.SELECT}>
        <FormField>
          <FormSelect onChange={(v) => onVMChange(v, defaultStorageClass)}>
            <FormSelectPlaceholderOption
              placeholder={t(getPlaceholderKey(VMWareProviderField.VM))}
              isDisabled={!!iGet(vmField, 'value')}
            />
            {vmNames &&
              vmNames.map((name) => (
                <FormSelectOption key={name} value={name} label={decodeURIComponent(name)} />
              ))}
          </FormSelect>
        </FormField>
      </FormFieldRow>
    );
  },
);

type VMWareVMsConnectedProps = {
  vmField: any;
  v2vvmware: any;
  onVMChange: (vm: string, defaultSC: StorageClassResourceKind) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  return {
    vmField: iGetVMWareField(state, wizardReduxID, VMWareProviderField.VM),
    v2vvmware: iGetCommonData(state, wizardReduxID, VMWareProviderProps.v2vvmware),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onVMChange: (vm, defaultSC) => {
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        VMWareProviderField.VM,
        { value: vm, vm: null, sc: defaultSC },
      ),
    );
    dispatch(requestVmDetails(wizardReduxID, vm));
  },
});

export const VMWareVMs = connect(stateToProps, dispatchToProps)(VMWareVMsConnected);
