import { InternalActionType, UpdateOptions } from '../../../../types';
import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
  VMWareProviderProps,
  VMWizardProps,
} from '../../../../../types';
import {
  hasVMWareSettingsChanged,
  iGetVMWareField,
  isVMWareProvider,
} from '../../../../../selectors/immutable/provider/vmware/selectors';
import { hasVmSettingsChanged } from '../../../../../selectors/immutable/vm-settings';
import { hasImportProvidersChanged } from '../../../../../selectors/immutable/import-providers';
import { getResource } from '../../../../../../../utils';
import { ConfigMapModel, DeploymentModel, PodModel, SecretModel } from '@console/internal/models';
import {
  V2VVMWARE_DEPLOYMENT_NAME,
  VCENTER_TEMPORARY_LABEL,
  VCENTER_TYPE_LABEL,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
} from '../../../../../../../constants/v2v';
import { V2VVMwareModel } from '../../../../../../../models';
import { vmWizardInternalActions } from '../../../../internal-actions';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { FirehoseResource } from '@console/internal/components/utils';
import { iGetIn } from '../../../../../../../utils/immutable';
import { iGetCreateVMWizard } from '../../../../../selectors/immutable/common';

type GetQueriesParams = {
  namespace: string;
  v2vVmwareName: string;
  activeVcenterSecretName: string;
};

const getQueries = ({
  namespace,
  v2vVmwareName,
  activeVcenterSecretName,
}: GetQueriesParams): FirehoseResource[] => {
  const resources = [
    getResource(SecretModel, {
      namespace,
      prop: VMWareProviderProps.vCenterSecrets,
      matchExpressions: [
        {
          key: VCENTER_TYPE_LABEL,
          operator: 'Exists',
        },
        {
          key: VCENTER_TEMPORARY_LABEL,
          operator: 'DoesNotExist',
        },
      ],
    }),
    getResource(ConfigMapModel, {
      name: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
      namespace: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
      isList: false,
      prop: VMWareProviderProps.vmwareToKubevirtOsConfigMap,
      optional: true,
    }),
    getResource(PodModel, {
      namespace,
      matchLabels: { name: V2VVMWARE_DEPLOYMENT_NAME },
      prop: VMWareProviderProps.deploymentPods,
    }),
    getResource(DeploymentModel, {
      namespace,
      name: V2VVMWARE_DEPLOYMENT_NAME,
      isList: false,
      prop: VMWareProviderProps.deployment,
    }),
  ];

  if (v2vVmwareName) {
    resources.push(
      getResource(V2VVMwareModel, {
        name: v2vVmwareName,
        namespace,
        isList: false,
        prop: VMWareProviderProps.v2vvmware,
      }),
    );
  }

  if (activeVcenterSecretName) {
    resources.push(
      getResource(SecretModel, {
        name: activeVcenterSecretName,
        namespace,
        isList: false,
        prop: VMWareProviderProps.activeVcenterSecret,
      }),
    );
  }
  return resources;
};

export const forceUpdateWSQueries = (
  { dispatch, id }: { id: string; dispatch: any },
  params: GetQueriesParams,
) => {
  dispatch(
    vmWizardInternalActions[InternalActionType.SetExtraWSQueries](
      id,
      VMImportProvider.VMWARE,
      getQueries(params),
    ),
  );
};

export const updateExtraWSQueries = (options: UpdateOptions) => {
  const { id, prevState, getState, changedCommonData, dispatch } = options;
  const state = getState();
  if (
    !(
      changedCommonData.has(VMWizardProps.activeNamespace) ||
      hasVmSettingsChanged(prevState, state, id, VMSettingsField.PROVISION_SOURCE_TYPE) ||
      hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER) ||
      hasVMWareSettingsChanged(
        prevState,
        state,
        id,
        VMWareProviderField.V2V_NAME,
        VMWareProviderField.NEW_VCENTER_NAME,
      )
    )
  ) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const oldQueries = iGetIn(iGetCreateVMWizard(state, id), [
    'extraWSQueries',
    VMImportProvider.VMWARE,
  ]);

  if (isVMWareProvider(state, id) && namespace) {
    const v2vVmwareName = iGetVMWareField(state, id, VMWareProviderField.V2V_NAME);
    const activeVcenterSecretName = iGetVMWareField(
      state,
      id,
      VMWareProviderField.NEW_VCENTER_NAME,
    );
    forceUpdateWSQueries({ id, dispatch }, { namespace, v2vVmwareName, activeVcenterSecretName });
  } else if (oldQueries && oldQueries.size > 0) {
    // reset when new provider selected
    dispatch(
      vmWizardInternalActions[InternalActionType.SetExtraWSQueries](
        id,
        VMImportProvider.VMWARE,
        [],
      ),
    );
  }
};
