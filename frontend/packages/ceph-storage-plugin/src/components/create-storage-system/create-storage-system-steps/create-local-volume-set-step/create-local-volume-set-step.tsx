import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Form,
  Grid,
  GridItem,
  Modal,
  WizardContext,
  WizardContextType,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/request';
import {
  LocalVolumeDiscoveryResult,
  LocalVolumeSetModel,
} from '@console/local-storage-operator-plugin/src/models';
import { useFlag } from '@console/shared/src';
import {
  k8sCreate,
  ListKind,
  NodeKind,
  referenceForModel,
  WatchK8sResource,
} from '@console/internal/module/k8s';
import {
  createLocalVolumeDiscovery,
  updateLocalVolumeDiscovery,
} from '@console/local-storage-operator-plugin/src/components/local-volume-discovery/request';
import { LABEL_OPERATOR } from '@console/local-storage-operator-plugin/src/constants';
import { LABEL_SELECTOR } from '@console/local-storage-operator-plugin/src/constants/disks-list';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LocalVolumeDiscoveryResultKind } from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NodeModel } from '@console/internal/models';
import { LocalVolumeSetBody } from './body';
import { SelectedCapacity } from './selected-capacity';
import { createWizardNodeState } from '../../../../utils/create-storage-system';
import { GUARDED_FEATURES } from '../../../../features';
import { arbiterText, LSO_OPERATOR, MINIMUM_NODES, OCS_TOLERATION } from '../../../../constants';
import { ErrorHandler } from '../../error-handler';
import { WizardDispatch, WizardNodeState, WizardState } from '../../reducer';
import { useFetchCsv } from '../../use-fetch-csv';
import { RequestErrors } from '../../../ocs-install/install-wizard/review-and-create';
import './create-local-volume-set-step.scss';
import { nodesWithoutTaints } from '../../../../utils/install';

const goToLSOInstallationPage = () =>
  history.push(
    '/operatorhub/all-namespaces?details-item=local-storage-operator-redhat-operators-openshift-marketplace',
  );

const makeLocalVolumeSetCall = (
  state: WizardState['createLocalVolumeSet'],
  storageClassName: string,
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  ns: string,
  onNext: () => void,
  lvsNodes: WizardState['nodes'],
) => {
  setInProgress(true);

  const nodes = lvsNodes.map((node) => node.hostName);

  const requestData = getLocalVolumeSetRequestData(
    { ...state, storageClassName },
    nodes,
    ns,
    OCS_TOLERATION,
  );
  k8sCreate(LocalVolumeSetModel, requestData)
    .then(() => {
      setInProgress(false);
      onNext();
    })
    .catch((err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
};

export const LSOInstallAlert = () => {
  const { t } = useTranslation();
  return (
    <Alert
      variant="info"
      title={t('ceph-storage-plugin~Local Storage Operator not installed')}
      className="odf-create-lvs__alert--override"
      isInline
    >
      <Trans t={t} ns="ceph-storage-plugin">
        Before we can create a StorageSystem, the Local Storage Operator needs to be installed. When
        installation is finished come back to OpenShift Data Foundation to create a StorageSystem.
        <div className="ceph-ocs-install__lso-alert__button">
          <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
            Install
          </Button>
        </div>
      </Trans>
    </Alert>
  );
};

const initDiskDiscovery = async (
  nodes: WizardNodeState[] = [],
  namespace: string,
  setError: (error: any) => void,
  setInProgress: (inProgress: boolean) => void,
) => {
  setInProgress(true);
  const nodeByHostNames: string[] = nodes.map((node) => node.hostName);
  try {
    await updateLocalVolumeDiscovery(nodeByHostNames, namespace, setError);
  } catch (loadError) {
    if (loadError?.response?.status === 404) {
      try {
        await createLocalVolumeDiscovery(nodeByHostNames, namespace, OCS_TOLERATION);
      } catch (createError) {
        setError(createError.message);
      }
    }
  } finally {
    setError(false);
    setInProgress(false);
  }
};

const getLvdrResource = (nodes: WizardNodeState[] = [], ns: string): WatchK8sResource => {
  return {
    kind: referenceForModel(LocalVolumeDiscoveryResult),
    namespace: ns,
    isList: true,
    selector: {
      matchExpressions: [
        {
          key: LABEL_SELECTOR,
          operator: LABEL_OPERATOR,
          values: nodes.map((node) => node.name),
        },
      ],
    },
  };
};

export const CreateLocalVolumeSet: React.FC<CreateLocalVolumeSetProps> = ({
  state,
  storageClass,
  dispatch,
  nodes,
  stepIdReached,
}) => {
  const { t } = useTranslation();
  const allNodes = React.useRef([]);

  const [csv, csvLoaded, csvLoadError] = useFetchCsv(LSO_OPERATOR);
  const [rawNodes, rawNodesLoaded, rawNodesLoadError] = useK8sGet<ListKind<NodeKind>>(NodeModel);
  const [lvdResults, lvdResultsLoaded] = useK8sWatchResource<LocalVolumeDiscoveryResultKind[]>(
    getLvdrResource(allNodes.current, csv?.metadata?.namespace),
  );
  const [lvdInProgress, setLvdInProgress] = React.useState(false);
  const [lvdError, setLvdError] = React.useState(null);
  const [lvsetInProgress, setLvsetInProgress] = React.useState(false);
  const [lvsetError, setLvsetError] = React.useState(null);

  React.useEffect(() => {
    const nonTaintedNodes = nodesWithoutTaints(rawNodes?.items);
    allNodes.current = createWizardNodeState(nonTaintedNodes);
  }, [rawNodes]);

  React.useEffect(() => {
    if (!csvLoadError && csvLoaded && allNodes.current.length) {
      initDiskDiscovery(allNodes.current, csv?.metadata.namespace, setLvdError, setLvdInProgress);
    }
  }, [csv, csvLoadError, csvLoaded, rawNodes]);

  const discoveriesLoaded =
    csvLoaded &&
    !lvdInProgress &&
    rawNodesLoaded &&
    lvdResultsLoaded &&
    allNodes.current?.length === lvdResults?.length;

  const discoveriesLoadError = csvLoadError || rawNodesLoadError || lvdError;
  const ns = csv?.metadata?.namespace;

  return (
    <ErrorHandler
      loaded={discoveriesLoaded}
      loadingMessage={
        !csvLoaded
          ? t('ceph-storage-plugin~Checking Local Storage Operator installation')
          : !discoveriesLoaded
          ? t('ceph-storage-plugin~Discovering disks on all hosts. This may take a few minutes.')
          : null
      }
      error={discoveriesLoadError}
      errorMessage={csvLoadError || csv?.status?.phase !== 'Succeeded' ? <LSOInstallAlert /> : null}
    >
      <>
        <Grid>
          <GridItem lg={8} md={8} sm={8}>
            <Form noValidate={false} className="odf-create-lvs__form">
              <LocalVolumeSetBody
                state={state}
                dispatch={dispatch}
                storageClassName={storageClass.name}
                allNodes={allNodes.current}
                nodes={nodes}
              />
            </Form>
          </GridItem>
          <GridItem
            lg={3}
            lgOffset={9}
            md={3}
            mdOffset={9}
            sm={3}
            smOffset={9}
            className="odf-create-lvs__donut-chart"
          >
            <SelectedCapacity
              dispatch={dispatch}
              state={state}
              ns={ns}
              nodes={nodes}
              lvdResults={lvdResults}
            />
          </GridItem>
        </Grid>
        <ConfirmationModal
          ns={ns}
          nodes={nodes}
          state={state}
          dispatch={dispatch}
          setInProgress={setLvsetInProgress}
          setErrorMessage={setLvsetError}
          storageClassName={storageClass.name}
          stepIdReached={stepIdReached}
        />
        {state.chartNodes.size < MINIMUM_NODES && (
          <Alert
            className="odf-create-lvs__alert"
            variant="danger"
            title={t('ceph-storage-plugin~Minimum Node Requirement')}
            isInline
          >
            {t(
              'ceph-storage-plugin~A minimum of 3 nodes are required for the initial deployment. Only {{nodes}} node match to the selected filters. Please adjust the filters to include more nodes.',
              { nodes: state.chartNodes.size },
            )}
          </Alert>
        )}
        <RequestErrors errorMessage={lvsetError} inProgress={lvsetInProgress} />
      </>
    </ErrorHandler>
  );
};

type CreateLocalVolumeSetProps = {
  state: WizardState['createLocalVolumeSet'];
  storageClass: WizardState['storageClass'];
  nodes: WizardState['nodes'];
  stepIdReached: WizardState['stepIdReached'];
  dispatch: WizardDispatch;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  state,
  dispatch,
  setInProgress,
  setErrorMessage,
  storageClassName,
  stepIdReached,
  ns,
  nodes,
}) => {
  const { t } = useTranslation();
  const isArbiterSupported = useFlag(GUARDED_FEATURES.OCS_ARBITER);
  const { onNext, activeStep } = React.useContext<WizardContextType>(WizardContext);

  const cancel = () => {
    dispatch({
      type: 'wizard/setCreateLocalVolumeSet',
      payload: { field: 'showConfirmModal', value: false },
    });
  };

  const handleNext = () => {
    const stepId = activeStep.id as number;
    dispatch({
      type: 'wizard/setStepIdReached',
      payload: stepIdReached <= stepId ? stepId + 1 : stepIdReached,
    });
    onNext();
  };

  const makeLVSCall = () => {
    cancel();
    makeLocalVolumeSetCall(
      state,
      storageClassName,
      setInProgress,
      setErrorMessage,
      ns,
      handleNext,
      nodes,
    );
  };

  const description = (
    <>
      <span>
        {t(
          "ceph-storage-plugin~After the LocalVolumeSet is created you won't be able to go back to this step.",
        )}
      </span>
      {isArbiterSupported && (
        <p className="pf-u-pt-sm">
          <strong>{t('ceph-storage-plugin~Note:')} </strong>
          {arbiterText(t)}
        </p>
      )}
    </>
  );
  return (
    <Modal
      title={t('ceph-storage-plugin~Create LocalVolumeSet')}
      isOpen={state.showConfirmModal}
      onClose={cancel}
      variant="small"
      actions={[
        <Button key="confirm" variant="primary" onClick={makeLVSCall}>
          {t('ceph-storage-plugin~Yes')}
        </Button>,
        <Button key="cancel" variant="link" onClick={cancel}>
          {t('ceph-storage-plugin~Cancel')}
        </Button>,
      ]}
      description={description}
    >
      <p>{t('ceph-storage-plugin~Are you sure you want to continue?')}</p>
    </Modal>
  );
};

type ConfirmationModalProps = {
  state: WizardState['createLocalVolumeSet'];
  dispatch: WizardDispatch;
  storageClassName: string;
  ns: string;
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  nodes: WizardState['nodes'];
  stepIdReached: WizardState['stepIdReached'];
};
