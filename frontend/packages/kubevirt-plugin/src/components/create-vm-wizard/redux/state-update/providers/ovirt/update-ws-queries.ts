import { DeploymentModel, PodModel, SecretModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { kvReferenceForModel } from '../../../../../../models/kvReferenceForModel';

import {
  OVIRT_TYPE_LABEL,
  V2V_TEMPORARY_LABEL,
  V2VVMWARE_DEPLOYMENT_NAME,
} from '../../../../../../constants/v2v';
import { OVirtProviderModel } from '../../../../../../models';
import { FirehoseResourceEnhanced } from '../../../../../../types/custom';
import { iGetIn } from '../../../../../../utils/immutable';
import { iGetCreateVMWizard } from '../../../../selectors/immutable/common';
import { hasImportProvidersChanged } from '../../../../selectors/immutable/import-providers';
import {
  hasOvirtSettingsChanged,
  iGetOvirtField,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import {
  ImportProvidersField,
  OvirtProviderField,
  OvirtProviderProps,
  VMImportProvider,
  VMWizardProps,
} from '../../../../types';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';

type GetQueriesParams = {
  namespace: string;
  activeOvirtProviderCRName: string;
};

const getQueries = ({
  namespace,
  activeOvirtProviderCRName,
}: GetQueriesParams): FirehoseResourceEnhanced[] => {
  const resources: FirehoseResourceEnhanced[] = [
    {
      kind: SecretModel.kind,
      model: SecretModel,
      isList: true,
      namespace,
      prop: OvirtProviderProps.ovirtEngineSecrets,
      selector: {
        matchExpressions: [
          {
            key: OVIRT_TYPE_LABEL,
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
      kind: PodModel.kind,
      model: PodModel,
      namespace,
      isList: true,
      selector: {
        matchLabels: { name: V2VVMWARE_DEPLOYMENT_NAME },
      },
      prop: OvirtProviderProps.deploymentPods,
    },
    {
      kind: DeploymentModel.kind,
      model: DeploymentModel,
      namespace,
      name: V2VVMWARE_DEPLOYMENT_NAME,
      isList: false,
      prop: OvirtProviderProps.deployment,
      errorBehaviour: {
        ignore404: true,
      },
    },
    {
      kind: referenceForModel(NetworkAttachmentDefinitionModel),
      model: NetworkAttachmentDefinitionModel,
      isList: true,
      namespace,
      prop: OvirtProviderProps.networkAttachmentDefinitions,
      errorBehaviour: {
        ignore404: true,
      },
    },
  ];

  if (activeOvirtProviderCRName) {
    resources.push({
      kind: kvReferenceForModel(OVirtProviderModel),
      model: OVirtProviderModel,
      name: activeOvirtProviderCRName,
      namespace,
      isList: false,
      prop: OvirtProviderProps.ovirtProvider,
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
      VMImportProvider.OVIRT,
      getQueries(params),
    ),
  );
};

export const updateExtraWSQueries = (options: UpdateOptions) => {
  const { id, prevState, getState, dispatch } = options;
  const state = getState();
  if (
    !(
      hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER) ||
      hasOvirtSettingsChanged(
        prevState,
        state,
        id,
        OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME,
      )
    )
  ) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const oldQueries = iGetIn(iGetCreateVMWizard(state, id), [
    'extraWSQueries',
    VMImportProvider.OVIRT,
  ]);

  if (isOvirtProvider(state, id) && namespace) {
    const activeOvirtProviderCRName = iGetOvirtField(
      state,
      id,
      OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME,
    );
    forceUpdateWSQueries({ id, dispatch }, { namespace, activeOvirtProviderCRName });
  } else if (oldQueries && oldQueries.size > 0) {
    // reset when new provider selected
    dispatch(
      vmWizardInternalActions[InternalActionType.SetExtraWSQueries](id, VMImportProvider.OVIRT, []),
    );
  }
};
