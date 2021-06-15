import { ConfigMapModel, DeploymentModel, PodModel, SecretModel } from '@console/internal/models';
import { kvReferenceForModel } from '../../../../../../models/kvReferenceForModel';

import {
  V2V_TEMPORARY_LABEL,
  V2VVMWARE_DEPLOYMENT_NAME,
  VCENTER_TYPE_LABEL,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
} from '../../../../../../constants/v2v';
import { V2VVMwareModel } from '../../../../../../models';
import { FirehoseResourceEnhanced } from '../../../../../../types/custom';
import { iGetIn } from '../../../../../../utils/immutable';
import { iGetCreateVMWizard } from '../../../../selectors/immutable/common';
import { hasImportProvidersChanged } from '../../../../selectors/immutable/import-providers';
import {
  hasVMWareSettingsChanged,
  iGetVMWareField,
  isVMWareProvider,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import {
  ImportProvidersField,
  VMImportProvider,
  VMWareProviderField,
  VMWareProviderProps,
  VMWizardProps,
} from '../../../../types';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';

type GetQueriesParams = {
  namespace: string;
  v2vVmwareName: string;
};

const getQueries = ({ namespace, v2vVmwareName }: GetQueriesParams): FirehoseResourceEnhanced[] => {
  const resources: FirehoseResourceEnhanced[] = [
    {
      kind: SecretModel.kind,
      model: SecretModel,
      isList: true,
      namespace,
      prop: VMWareProviderProps.vCenterSecrets,
      selector: {
        matchExpressions: [
          {
            key: VCENTER_TYPE_LABEL,
            operator: 'Exists',
          },
          {
            key: V2V_TEMPORARY_LABEL,
            operator: 'DoesNotExist',
          },
        ],
      },
    },
    {
      kind: ConfigMapModel.kind,
      model: ConfigMapModel,
      name: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
      namespace: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
      isList: false,
      prop: VMWareProviderProps.vmwareToKubevirtOsConfigMap,
      optional: true,
      errorBehaviour: {
        ignore404: true,
      },
    },
    {
      kind: PodModel.kind,
      model: PodModel,
      isList: true,
      namespace,
      selector: {
        matchLabels: { name: V2VVMWARE_DEPLOYMENT_NAME },
      },
      prop: VMWareProviderProps.deploymentPods,
    },
    {
      kind: DeploymentModel.kind,
      namespace,
      name: V2VVMWARE_DEPLOYMENT_NAME,
      isList: false,
      prop: VMWareProviderProps.deployment,
      model: DeploymentModel,
      errorBehaviour: {
        ignore404: true,
      },
    },
  ];

  if (v2vVmwareName) {
    resources.push({
      kind: kvReferenceForModel(V2VVMwareModel),
      model: V2VVMwareModel,
      name: v2vVmwareName,
      namespace,
      isList: false,
      prop: VMWareProviderProps.v2vvmware,
    });
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
      hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER) ||
      hasVMWareSettingsChanged(
        prevState,
        state,
        id,
        VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME,
        VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME,
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
    const v2vVmwareName = iGetVMWareField(
      state,
      id,
      VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME,
    );
    forceUpdateWSQueries({ id, dispatch }, { namespace, v2vVmwareName });
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
