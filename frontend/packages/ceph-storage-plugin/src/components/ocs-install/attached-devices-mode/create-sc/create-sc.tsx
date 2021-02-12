import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import {
  Wizard,
  WizardFooter,
  WizardContextConsumer,
  Button,
  Alert,
  WizardStep,
  AlertActionCloseButton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { setFlag } from '@console/internal/actions/features';
import {
  k8sCreate,
  k8sGet,
  k8sPatch,
  K8sResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { LocalVolumeDiscovery } from '@console/local-storage-operator-plugin/src/models';
import { getDiscoveryRequestData } from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/discovery-request-data';
import { DISCOVERY_CR_NAME } from '@console/local-storage-operator-plugin/src/constants';
import {
  getNodes,
  getNodeSelectorTermsIndices,
  getHostNames,
} from '@console/local-storage-operator-plugin/src/utils';
import { DiskType } from '@console/local-storage-operator-plugin/src/components/local-volume-set/types';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { initialState, reducer, State, Action, Discoveries } from './state';
import { AutoDetectVolume } from './wizard-pages/auto-detect-volume';
import { CreateLocalVolumeSet } from './wizard-pages/create-local-volume-set';
import { nodesDiscoveriesResource } from '../../../../constants/resources';
import { getTotalDeviceCapacity } from '../../../../utils/install';
import {
  AVAILABLE,
  CreateStepsSC,
  MINIMUM_NODES,
  defaultRequestSize,
  OCS_INTERNAL_CR_NAME,
  OCS_TOLERATION,
} from '../../../../constants';
import { StorageAndNodes } from './wizard-pages/storage-and-nodes-step';
import '../attached-devices.scss';
import { getName } from '@console/shared';
import { StorageClusterKind } from '../../../../types';
import { getOCSRequestData, labelNodes, labelOCSNamespace } from '../../ocs-request-data';
import { OCSServiceModel } from '../../../../models';
import { OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../../../features';
import { ReviewAndCreate } from './wizard-pages/review-and-create-step';
import { Configure } from './wizard-pages/configure-step';
import '../../install-wizard/install-wizard.scss';
import { createKmsResources } from '../../../kms-config/utils';

const makeAutoDiscoveryCall = async (
  state: State,
  dispatch: React.Dispatch<Action>,
  ns: string,
  onNext: () => void,
) => {
  dispatch({ type: 'setIsLoading', value: true });
  const selectedNodes = getNodes(
    state.showNodesListOnADV,
    state.allNodeNamesOnADV,
    state.nodeNamesForLVS,
  );

  try {
    const discoveryRes: K8sResourceKind = await k8sGet(LocalVolumeDiscovery, DISCOVERY_CR_NAME, ns);
    const nodeSelectorTerms = discoveryRes?.spec?.nodeSelector?.nodeSelectorTerms;
    const [selectorIndex, expIndex] = getNodeSelectorTermsIndices(nodeSelectorTerms);
    if (selectorIndex !== -1 && expIndex !== -1) {
      const nodes = new Set(
        discoveryRes?.spec?.nodeSelector?.nodeSelectorTerms?.[selectorIndex]?.matchExpressions?.[
          expIndex
        ]?.values,
      );
      const hostNames = getHostNames(selectedNodes, state.hostNamesMapForADV);
      hostNames.forEach((name) => nodes.add(name));
      const patch = [
        {
          op: 'replace',
          path: `/spec/nodeSelector/nodeSelectorTerms/${selectorIndex}/matchExpressions/${expIndex}/values`,
          value: Array.from(nodes),
        },
      ];
      await k8sPatch(LocalVolumeDiscovery, discoveryRes, patch);
      onNext();
      dispatch({ type: 'setError', value: '' });
    } else {
      throw new Error(
        'Could not find matchExpression of type key: "kubernetes.io/hostname" and operator: "In"',
      );
    }
  } catch (patchError) {
    if (patchError?.response?.status === 404) {
      try {
        const requestData = getDiscoveryRequestData({ ...state, ns, toleration: OCS_TOLERATION });
        await k8sCreate(LocalVolumeDiscovery, requestData);
        onNext();
      } catch (createError) {
        dispatch({ type: 'setError', value: createError.message });
      }
    } else {
      dispatch({ type: 'setError', value: patchError.message });
    }
  } finally {
    dispatch({ type: 'setIsLoading', value: false });
    dispatch({ type: 'setNodeNamesForLVS', value: selectedNodes });
  }
};

const CreateSC: React.FC<CreateSCProps> = ({ match, hasNoProvSC, mode, lsoNs }) => {
  const { t } = useTranslation();
  const { appName, ns } = match.params;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [discoveriesData, discoveriesLoaded, discoveriesLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >(nodesDiscoveriesResource);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const flagDispatcher = useDispatch();

  React.useEffect(() => {
    if (discoveriesLoaded && !discoveriesLoadError && discoveriesData.length) {
      const nodesDiscoveries: Discoveries[] = discoveriesData.reduce((res, nodeDiscovery) => {
        const name = nodeDiscovery?.spec?.nodeName;
        const selectedNodes = getNodes(
          state.showNodesListOnADV,
          state.allNodeNamesOnADV,
          state.nodeNamesForLVS,
        );

        let availableDisks: Discoveries[] = [];
        if (selectedNodes.includes(name)) {
          const discoveries = nodeDiscovery?.status?.discoveredDevices ?? [];
          availableDisks = discoveries.filter((discovery) => {
            // filter out non supported disks
            if (
              discovery?.status?.state === AVAILABLE &&
              (discovery.type === DiskType.RawDisk || discovery.type === DiskType.Partition)
            ) {
              discovery.node = name;
              return true;
            }
            return false;
          });
        }
        return [...res, ...availableDisks];
      }, []);

      dispatch({ type: 'setNodesDiscoveries', value: nodesDiscoveries });
      const capacity = getTotalDeviceCapacity(nodesDiscoveries);
      dispatch({ type: 'setChartTotalData', value: capacity });
    }
  }, [
    discoveriesData,
    discoveriesLoaded,
    discoveriesLoadError,
    state.nodeNamesForLVS,
    state.showNodesListOnADV,
    state.allNodeNamesOnADV,
  ]);

  React.useEffect(() => {
    // this is required to set the hostnames for LVS too
    dispatch({ type: 'setHostNamesMapForLVS', value: state.hostNamesMapForADV });
  }, [state.hostNamesMapForADV]);

  const discoveryNodes = getNodes(
    state.showNodesListOnADV,
    state.allNodeNamesOnADV,
    state.nodeNamesForLVS,
  );

  const steps: WizardStep[] = [
    {
      id: CreateStepsSC.DISCOVER,
      name: t('ceph-storage-plugin~Discover Disks'),
      component: <AutoDetectVolume state={state} dispatch={dispatch} />,
    },
    {
      id: CreateStepsSC.STORAGECLASS,
      name: t('ceph-storage-plugin~Create Storage Class'),
      component: <CreateLocalVolumeSet dispatch={dispatch} state={state} ns={lsoNs} />,
    },
    {
      id: CreateStepsSC.STORAGEANDNODES,
      name: t('ceph-storage-plugin~Storage and Nodes'),
      component: <StorageAndNodes dispatch={dispatch} state={state} />,
    },
    {
      id: CreateStepsSC.CONFIGURE,
      name: t('ceph-storage-plugin~Configure'),
      component: <Configure dispatch={dispatch} state={state} mode={mode} />,
    },
    {
      id: CreateStepsSC.REVIEWANDCREATE,
      name: t('ceph-storage-plugin~Review and Create'),
      nextButtonText: t('ceph-storage-plugin~Create'),
      component: (
        <ReviewAndCreate state={state} inProgress={inProgress} errorMessage={errorMessage} />
      ),
    },
  ];

  const createCluster = async () => {
    try {
      setInProgress(true);
      const {
        storageClass,
        encryption,
        nodes,
        enableMinimal,
        enableFlexibleScaling,
        kms,
        publicNetwork,
        clusterNetwork,
        selectedArbiterZone,
        stretchClusterChecked,
      } = state;

      const storageCluster: StorageClusterKind = getOCSRequestData(
        storageClass,
        defaultRequestSize.BAREMETAL,
        encryption.clusterWide,
        enableMinimal,
        enableFlexibleScaling,
        publicNetwork,
        clusterNetwork,
        kms.hasHandled && encryption.advanced,
        selectedArbiterZone,
        stretchClusterChecked,
      );
      const promises: Promise<K8sResourceKind>[] = [...labelNodes(nodes), labelOCSNamespace()];
      if (encryption.advanced && kms.hasHandled) {
        promises.push(...createKmsResources(kms));
      }
      await Promise.all(promises).then(() => k8sCreate(OCSServiceModel, storageCluster));
      flagDispatcher(setFlag(OCS_ATTACHED_DEVICES_FLAG, true));
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, true));
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, false));
      flagDispatcher(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setInProgress(false);
    }
  };

  /**
   * This custom footer for wizard provides a control over the movement to next step.
   * This allows error handling per step and moves to next step only when API request is successful.
   */
  const CustomFooter: React.ReactNode = (
    <WizardFooter>
      <WizardContextConsumer>
        {({ activeStep, onNext, onBack, onClose }) => {
          const nextButtonFactory = {
            [CreateStepsSC.DISCOVER]: {
              onNextClick: () => makeAutoDiscoveryCall(state, dispatch, lsoNs, onNext),
              isNextDisabled: state.isLoading || discoveryNodes.length < MINIMUM_NODES,
            },
            [CreateStepsSC.STORAGECLASS]: {
              onNextClick: () => dispatch({ type: 'setShowConfirmModal', value: true }),
              isNextDisabled:
                state.filteredNodes.length < MINIMUM_NODES ||
                !state.volumeSetName.trim().length ||
                !state.isValidDiskSize,
            },
            [CreateStepsSC.STORAGEANDNODES]: {
              onNextClick: () => onNext(),
              isNextDisabled: state.nodes.length < MINIMUM_NODES || !getName(state.storageClass),
            },
            [CreateStepsSC.CONFIGURE]: {
              onNextClick: () => onNext(),
              isNextDisabled: !state.encryption.hasHandled || !state.kms.hasHandled,
            },
            [CreateStepsSC.REVIEWANDCREATE]: {
              onNextClick: () => createCluster(),
              isNextDisabled:
                state.nodes.length < MINIMUM_NODES ||
                !getName(state.storageClass) ||
                !state.kms.hasHandled,
            },
          };
          const { id } = activeStep;

          return (
            <>
              <Button
                variant="primary"
                type="submit"
                isDisabled={nextButtonFactory[id].isNextDisabled}
                onClick={nextButtonFactory[id].onNextClick}
              >
                {id === CreateStepsSC.REVIEWANDCREATE
                  ? t('ceph-storage-plugin~Create')
                  : t('ceph-storage-plugin~Next')}
              </Button>
              <Button
                variant="secondary"
                onClick={onBack}
                isDisabled={id === CreateStepsSC.DISCOVER}
              >
                {t('ceph-storage-plugin~Back')}
              </Button>
              <Button variant="link" onClick={onClose}>
                {t('ceph-storage-plugin~Cancel')}
              </Button>
            </>
          );
        }}
      </WizardContextConsumer>
    </WizardFooter>
  );

  return (
    <Stack>
      <StackItem>
        {showInfoAlert && (
          <Alert
            className="co-alert ocs-install-info-alert"
            variant="info"
            isInline
            title={
              !hasNoProvSC
                ? t('ceph-storage-plugin~Missing storage class')
                : 'Internal - Attached devices'
            }
            actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
          >
            {!hasNoProvSC
              ? t(
                  'ceph-storage-plugin~The storage cluster needs to use a storage class to consume the local storage. In order to create one you need to discover the available disks and create a storage class using the filters to select the disks you wish to use',
                )
              : t(
                  'ceph-storage-plugin~Can be used on any platform. It means that OCS uses attached disks, via Local Storage Operator. In this case, the infrastructure storage class is actually provided by LSO, on top of attached drives.',
                )}
          </Alert>
        )}
      </StackItem>
      <StackItem isFilled>
        <Wizard
          className="ocs-install-wizard"
          steps={steps}
          startAtStep={hasNoProvSC ? 3 : 1}
          onClose={() =>
            history.push(resourcePathFromModel(ClusterServiceVersionModel, appName, ns))
          }
          footer={CustomFooter}
          onSave={createCluster}
          cancelButtonText={t('ceph-storage-plugin~Cancel')}
          nextButtonText={t('ceph-storage-plugin~Next')}
          backButtonText={t('ceph-storage-plugin~Back')}
        />
      </StackItem>
    </Stack>
  );
};

type CreateSCProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
  hasNoProvSC: boolean;
  setHasNoProvSC: React.Dispatch<React.SetStateAction<boolean>>;
  mode: string;
  lsoNs: string;
};

export default CreateSC;
