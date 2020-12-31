import * as _ from 'lodash';
import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAccessReview2 } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { StorageClassModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { OvirtProviderField, OvirtProviderProps, VMImportProvider } from '../../../../types';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormFieldRow } from '../../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormSelectPlaceholderOption } from '../../../../../form/form-select-placeholder-option';
import { getPlaceholderKey } from '../../../../utils/renderable-field-utils';
import { ignoreCaseSort } from '../../../../../../utils/sort';
import { iGetOvirtField } from '../../../../selectors/immutable/provider/ovirt/selectors';
import { requestVmDetails } from '../../../../redux/state-update/providers/ovirt/ovirt-provider-actions';
import { getDefaultStorageClass } from '../../../../../../selectors/config-map/sc-defaults';

type VMBundle = {
  vmID: string;
  vmName: string;
  clusterName: string;
};

const OvirtProviderClustersVMsConnected: React.FC<OvirtProviderClustersVMsConnectedProps> = React.memo(
  ({ vmField, clusterField, ovirtProviderCR, onClusterChange, onVMChange }) => {
    const { t } = useTranslation();
    const iVMs = iGetIn(ovirtProviderCR, ['data', 'spec', 'vms']);

    const clusterName = iGet(clusterField, 'value');

    let clusters;
    let vms;

    if (iVMs) {
      const datacenterVMs: VMBundle[] = iVMs
        .filter((vm) => vm)
        .map((vm) => ({
          vmID: vm.get('id'),
          vmName: vm.get('name'),
          clusterName: vm.get('cluster'),
        }))
        .toArray();

      clusters = ignoreCaseSort(
        _.uniqBy(datacenterVMs, (vm) => vm.clusterName).map((vm) => vm.clusterName),
      );

      if (clusterName) {
        vms = ignoreCaseSort(
          datacenterVMs.filter((vm) => vm.clusterName === clusterName),
          ['vmName'],
        );
      }
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
      <>
        <FormFieldRow field={clusterField} fieldType={FormFieldType.SELECT}>
          <FormField>
            <FormSelect onChange={onClusterChange}>
              <FormSelectPlaceholderOption
                placeholder={t(getPlaceholderKey(OvirtProviderField.CLUSTER))}
                isDisabled={!!clusterName}
              />
              {clusters &&
                clusters.map((cName) => (
                  <FormSelectOption key={cName} value={cName} label={cName} />
                ))}
            </FormSelect>
          </FormField>
        </FormFieldRow>
        <FormFieldRow field={vmField} fieldType={FormFieldType.SELECT}>
          <FormField isDisabled={!clusterName}>
            <FormSelect onChange={(v) => onVMChange(v, defaultStorageClass)}>
              <FormSelectPlaceholderOption
                placeholder={t(getPlaceholderKey(OvirtProviderField.VM))}
                isDisabled={!!iGet(vmField, 'value')}
              />
              {vms &&
                vms.map(({ vmName, vmID }) => (
                  <FormSelectOption key={vmID} value={vmID} label={vmName} />
                ))}
            </FormSelect>
          </FormField>
        </FormFieldRow>
      </>
    );
  },
);

type OvirtProviderClustersVMsConnectedProps = {
  vmField: any;
  clusterField: any;
  ovirtProviderCR: any;
  onVMChange: (vmID: string, defaultSC: StorageClassResourceKind) => void;
  onClusterChange: (clusterID: string) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  return {
    clusterField: iGetOvirtField(state, wizardReduxID, OvirtProviderField.CLUSTER),
    vmField: iGetOvirtField(state, wizardReduxID, OvirtProviderField.VM),
    ovirtProviderCR: iGetCommonData(state, wizardReduxID, OvirtProviderProps.ovirtProvider),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => {
  const onVM = (vmID, defaultSC) => {
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.OVIRT,
        OvirtProviderField.VM,
        { value: vmID, vm: null, sc: defaultSC },
      ),
    );
  };

  return {
    onClusterChange: (clusterName) => {
      onVM(null, null);
      dispatch(
        vmWizardActions[ActionType.UpdateImportProviderField](
          wizardReduxID,
          VMImportProvider.OVIRT,
          OvirtProviderField.CLUSTER,
          { value: clusterName },
        ),
      );
    },

    onVMChange: (vmID, defaultSC) => {
      onVM(vmID, defaultSC);
      dispatch(requestVmDetails(wizardReduxID, vmID));
    },
  };
};

export const OvirtProviderClustersVMs = connect(
  stateToProps,
  dispatchToProps,
)(OvirtProviderClustersVMsConnected);
