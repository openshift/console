import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import {
  Wizard,
  WizardFooter,
  WizardContextConsumer,
  Button,
  Alert,
  WizardStep,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { k8sCreate, k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { fetchK8s } from '@console/internal/graphql/client';
import { LocalVolumeDiscovery } from '@console/local-storage-operator-plugin/src/models';
import { getDiscoveryRequestData } from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/discovery-request-data';
import {
  LOCAL_STORAGE_NAMESPACE,
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
import {
  DiskMechanicalProperties,
  DiskType,
} from '@console/local-storage-operator-plugin/src/components/local-volume-set/types';
import { initialState, reducer, State, Action, Discoveries, OnNextClick } from './state';
import { AutoDetectVolume } from './wizard-pages/auto-detect-volume';
import { CreateLocalVolumeSet } from './wizard-pages/create-local-volume-set';
import { nodesDiscoveriesResource } from '../../../../constants/resources';
import { getTotalDeviceCapacity } from '../../../../utils/install';
import { AVAILABLE, CreateStepsSC, MINIMUM_NODES } from '../../../../constants';
import { CreateOCS } from '../install-lso-sc';
import '../attached-devices.scss';

const makeAutoDiscoveryCall = (
  onNext: OnNextClick,
  state: State,
  dispatch: React.Dispatch<Action>,
) => {
  dispatch({ type: 'setIsLoading', value: true });
  const selectedNodes = getNodes(
    state.showNodesListOnADV,
    state.allNodeNamesOnADV,
    state.nodeNamesForLVS,
  );

  fetchK8s(LocalVolumeDiscovery, DISCOVERY_CR_NAME, LOCAL_STORAGE_NAMESPACE)
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
      const requestData = getDiscoveryRequestData(state);
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

const CreateSC: React.FC<CreateSCProps> = ({ match }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [discoveriesData, discoveriesLoaded, discoveriesLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >(nodesDiscoveriesResource);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);

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
              discovery.property === DiskMechanicalProperties.SSD &&
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

  const steps = [
    {
      id: CreateStepsSC.DISCOVER,
      name: 'Discover Disks',
      component: <AutoDetectVolume state={state} dispatch={dispatch} />,
    },
    {
      id: CreateStepsSC.STORAGECLASS,
      name: 'Create Storage Class',
      component: <CreateLocalVolumeSet dispatch={dispatch} state={state} />,
    },
    {
      id: CreateStepsSC.STORAGECLUSTER,
      name: 'Create Storage Cluster',
      component: <CreateOCS match={match} />,
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

      default:
        return false;
    }
  };

  const makeCall = (activeStep: WizardStep, onNext: OnNextClick) => {
    // TODO: Need to think of a way to remove this
    dispatch({ type: 'setOnNextClick', value: onNext });
    if (activeStep.id === CreateStepsSC.DISCOVER) {
      makeAutoDiscoveryCall(onNext, state, dispatch);
    } else if (activeStep.id === CreateStepsSC.STORAGECLASS) {
      dispatch({ type: 'setShowConfirmModal', value: true });
    }
  };

  const CustomFooter = (
    <div>
      {!state.isLoading && state.error && (
        <Alert
          className="co-alert ceph-ocs-install__wizard-alert"
          variant="danger"
          title="An error occured"
          isInline
        >
          {state.error}
        </Alert>
      )}
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onNext, onBack, onClose }) => {
            if (activeStep.id !== CreateStepsSC.STORAGECLUSTER) {
              return (
                <>
                  <Button
                    variant="primary"
                    type="submit"
                    onClick={() => makeCall(activeStep, onNext)}
                    className={
                      state.isLoading || getDisabledCondition(activeStep) ? 'pf-m-disabled' : ''
                    }
                  >
                    Next
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onBack}
                    className={activeStep.id === CreateStepsSC.STORAGECLASS ? '' : 'pf-m-disabled'}
                  >
                    Back
                  </Button>
                  <Button variant="link" onClick={onClose}>
                    Cancel
                  </Button>
                </>
              );
            }
            return null;
          }}
        </WizardContextConsumer>
      </WizardFooter>
    </div>
  );

  return (
    <>
      {showInfoAlert && !state.finalStep && (
        <Alert
          className="co-alert"
          variant="info"
          title="Missing storage class"
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
        >
          The storage cluster needs to use a storage class to consume the local storage. In order to
          create one you need to discover the available disks and create a storage class using the
          filters to select the disks you wish to use.
        </Alert>
      )}
      <div className="ceph-create-sc-wizard">
        <Wizard steps={steps} onClose={() => history.goBack()} footer={CustomFooter} />
      </div>
    </>
  );
};

type CreateSCProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
};

export default CreateSC;
