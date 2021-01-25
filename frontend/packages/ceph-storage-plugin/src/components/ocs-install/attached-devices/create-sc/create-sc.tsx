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
  k8sPatch,
  K8sResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { fetchK8s } from '@console/internal/graphql/client';
import { LocalVolumeDiscovery } from '@console/local-storage-operator-plugin/src/models';
import { getDiscoveryRequestData } from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/discovery-request-data';
import {
  DISCOVERY_CR_NAME,
  HOSTNAME_LABEL_KEY,
  LABEL_OPERATOR,
  AUTO_DISCOVER_ERR_MSG,
} from '@console/local-storage-operator-plugin/src/constants';
import {
  getNodes,
  getLabelIndex,
  getHostNames,
} from '@console/local-storage-operator-plugin/src/utils';
import { DiskType } from '@console/local-storage-operator-plugin/src/components/local-volume-set/types';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { initialState, reducer, State, Action, Discoveries, OnNextClick } from './state';
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

const makeAutoDiscoveryCall = (
  onNext: OnNextClick,
  state: State,
  dispatch: React.Dispatch<Action>,
  ns: string,
) => {
  dispatch({ type: 'setIsLoading', value: true });
  const selectedNodes = getNodes(
    state.showNodesListOnADV,
    state.allNodeNamesOnADV,
    state.nodeNamesForLVS,
  );

  fetchK8s(LocalVolumeDiscovery, DISCOVERY_CR_NAME, ns)
    .then((discoveryRes: K8sResourceKind) => {
      const nodeSelectorTerms = discoveryRes?.spec?.nodeSelector?.nodeSelectorTerms;
      const [selectorIndex, expIndex] = nodeSelectorTerms
        ? getLabelIndex(nodeSelectorTerms, HOSTNAME_LABEL_KEY, LABEL_OPERATOR)
        : [-1, -1];
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
        return k8sPatch(LocalVolumeDiscovery, discoveryRes, patch);
      }
      throw new Error(AUTO_DISCOVER_ERR_MSG);
    })
    .catch((err) => {
      // handle AUTO_DISCOVER_ERR_MSG and throw to next catch block to show the message
      if (err.message === AUTO_DISCOVER_ERR_MSG) {
        throw err;
      }
      const requestData = getDiscoveryRequestData({ ...state, ns, toleration: OCS_TOLERATION });
      return k8sCreate(LocalVolumeDiscovery, requestData);
    })
    .then(() => {
      dispatch({ type: 'setNodeNamesForLVS', value: selectedNodes });
      onNext();
      dispatch({ type: 'setIsLoading', value: false });
    })
    .catch((err) => {
      dispatch({ type: 'setError', value: err.message });
      dispatch({ type: 'setIsLoading', value: false });
    });
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
      component: (
        <ReviewAndCreate state={state} inProgress={inProgress} errorMessage={errorMessage} />
      ),
    },
  ];

  const getDisabledCondition = (activeStep: WizardStep) => {
    switch (activeStep.id) {
      case CreateStepsSC.DISCOVER:
        return (
          getNodes(state.showNodesListOnADV, state.allNodeNamesOnADV, state.nodeNamesForLVS)
            .length < 1
        );
      case CreateStepsSC.STORAGECLASS:
        if (!state.volumeSetName.trim().length) return true;
        if (state.filteredNodes.length < MINIMUM_NODES) return true;
        return !state.volumeSetName.trim().length;
      case CreateStepsSC.STORAGEANDNODES:
        return state.nodes.length < MINIMUM_NODES || !getName(state.storageClass);
      case CreateStepsSC.REVIEWANDCREATE:
        return (
          state.nodes.length < MINIMUM_NODES ||
          !getName(state.storageClass) ||
          !state.kms.hasHandled
        );
      case CreateStepsSC.CONFIGURE:
        return !state.encryption.hasHandled || !state.kms.hasHandled;
      default:
        return false;
    }
  };

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

  const makeCall = (activeStep: WizardStep, onNext: OnNextClick) => {
    // TODO: Need to think of a way to remove this
    dispatch({ type: 'setOnNextClick', value: onNext });
    if (activeStep.id === CreateStepsSC.DISCOVER) {
      makeAutoDiscoveryCall(onNext, state, dispatch, lsoNs);
    } else if (activeStep.id === CreateStepsSC.STORAGECLASS) {
      dispatch({ type: 'setShowConfirmModal', value: true });
    } else if (activeStep.id === CreateStepsSC.REVIEWANDCREATE) {
      createCluster();
    } else {
      onNext();
    }
  };

  const CustomFooter = (
    <WizardFooter>
      <WizardContextConsumer>
        {({ activeStep, onNext, onBack, onClose }) => (
          <>
            <Button
              variant="primary"
              type="submit"
              onClick={() => makeCall(activeStep, onNext)}
              className={state.isLoading || getDisabledCondition(activeStep) ? 'pf-m-disabled' : ''}
            >
              {activeStep.id === CreateStepsSC.REVIEWANDCREATE
                ? t('ceph-storage-plugin~Create')
                : t('ceph-storage-plugin~Next')}
            </Button>
            <Button
              variant="secondary"
              onClick={onBack}
              className={activeStep.id === CreateStepsSC.DISCOVER ? 'pf-m-disabled' : ''}
            >
              {t('ceph-storage-plugin~Back')}
            </Button>
            <Button variant="link" onClick={onClose}>
              {t('ceph-storage-plugin~Cancel')}
            </Button>
          </>
        )}
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
