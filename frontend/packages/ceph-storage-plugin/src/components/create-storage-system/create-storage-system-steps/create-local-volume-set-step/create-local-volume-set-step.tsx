import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Bullseye,
  Form,
  Flex,
  FlexItem,
  Text,
  TextContent,
  Grid,
  GridItem,
  Modal,
  WizardContext,
  WizardContextType,
} from '@patternfly/react-core';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/request';
import {
  LocalVolumeDiscoveryResult,
  LocalVolumeSetModel,
} from '@console/local-storage-operator-plugin/src/models';
import { useFlag, RedExclamationCircleIcon } from '@console/shared/src';

import {
  K8sResourceCommon,
  apiVersionForModel,
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
import { NodeModel, NamespaceModel } from '@console/internal/models';
import {
  SubscriptionModel,
  OperatorGroupModel,
  PackageManifestModel,
} from '@console/operator-lifecycle-manager/src/models';
import {
  OperatorGroupKind,
  PackageManifestKind,
  SubscriptionKind,
  InstallPlanApproval,
} from '@console/operator-lifecycle-manager/src/types';
import { LocalVolumeSetBody } from './body';
import { SelectedCapacity } from './selected-capacity';
import { createWizardNodeState } from '../../../../utils/create-storage-system';
import { GUARDED_FEATURES } from '../../../../features';
import {
  arbiterText,
  LSO_OPERATOR,
  MINIMUM_NODES,
  NO_PROVISIONER,
  OCS_TOLERATION,
  LOCAL_STORAGE_NAMESPACE,
} from '../../../../constants';
import { ErrorHandler } from '../../error-handler';
import { WizardDispatch, WizardNodeState, WizardState } from '../../reducer';
import { useFetchCsv } from '../../use-fetch-csv';
import { RequestErrors } from '../../../ocs-install/install-wizard/review-and-create';
import './create-local-volume-set-step.scss';
import '../../create-storage-system.scss';
import { nodesWithoutTaints } from '../../../../utils/install';

enum InstallStatus {
  Failed = 'Failed',
  Progressing = 'Progressing',
  Succeeded = 'Succeeded',
}

const makeLocalVolumeSetCall = (
  state: WizardState['createLocalVolumeSet'],
  storageClassName: string,
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  ns: string,
  onNext: () => void,
  lvsNodes: WizardState['nodes'],
  dispatch: WizardDispatch,
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
      if (!storageClassName) {
        dispatch({
          type: 'wizard/setStorageClass',
          payload: { name: state.volumeSetName, provisioner: NO_PROVISIONER },
        });
      }
      onNext();
    })
    .catch((err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
};

export const LSOInstallFailed = () => {
  const { t } = useTranslation();
  return (
    <Bullseye className="odf-create-storage-system-wizard-body">
      <Flex direction={{ default: 'column' }}>
        <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
          <RedExclamationCircleIcon size={'xl'} />
        </FlexItem>
        <FlexItem>
          <TextContent>
            <Text>{t('ceph-storage-plugin~Local Storage Operator installation failed')}</Text>
          </TextContent>
        </FlexItem>
      </Flex>
    </Bullseye>
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
  const [lsoOpGroup, lsoOpGroupLoaded, lsoOpGroupLoadError] = useK8sGet<
    ListKind<OperatorGroupKind>
  >(OperatorGroupModel, '', LOCAL_STORAGE_NAMESPACE);
  const [lsoPkgManifest, lsoPkgManifestLoaded, lsoPkgManifestLoadError] = useK8sGet<
    PackageManifestKind
  >(PackageManifestModel, LSO_OPERATOR, LOCAL_STORAGE_NAMESPACE);
  const [lsoNs, lsoNsLoaded, lsoNsLoadError] = useK8sGet<K8sResourceCommon>(
    NamespaceModel,
    LOCAL_STORAGE_NAMESPACE,
  );

  const [lvdInProgress, setLvdInProgress] = React.useState(false);
  const [lvdError, setLvdError] = React.useState(null);
  const [lvsetInProgress, setLvsetInProgress] = React.useState(false);
  const [lvsetError, setLvsetError] = React.useState(null);
  const [lsoInstallStatus, setLsoInstallStatus] = React.useState(InstallStatus.Progressing);
  const madeLsoInstallationCall = React.useRef(false);

  React.useEffect(() => {
    const nonTaintedNodes = nodesWithoutTaints(rawNodes?.items);
    allNodes.current = createWizardNodeState(nonTaintedNodes);
  }, [rawNodes]);

  React.useEffect(() => {
    if (!csvLoadError && csvLoaded && allNodes.current.length) {
      initDiskDiscovery(allNodes.current, csv?.metadata.namespace, setLvdError, setLvdInProgress);
    }
  }, [csv, csvLoadError, csvLoaded, rawNodes]);

  React.useEffect(() => {
    if (csv?.status?.phase === 'Succeeded') setLsoInstallStatus(InstallStatus.Succeeded);
    else if (csv?.status?.phase === 'Failed') setLsoInstallStatus(InstallStatus.Failed);
  }, [csv]);

  const discoveriesLoaded =
    csvLoaded &&
    !lvdInProgress &&
    rawNodesLoaded &&
    lvdResultsLoaded &&
    allNodes.current?.length === lvdResults?.length;
  const discoveriesLoadError = csvLoadError || rawNodesLoadError || lvdError;
  const lsoResourcesLoaded = lsoOpGroupLoaded && lsoPkgManifestLoaded && lsoNsLoaded;
  const lsoResourcesLoadError = lsoOpGroupLoadError || lsoPkgManifestLoadError || lsoNsLoadError;
  const ns = csv?.metadata?.namespace;

  const makeLsoInstallationCall = async () => {
    const {
      channels,
      packageName,
      catalogSource,
      catalogSourceNamespace,
      defaultChannel,
    } = lsoPkgManifest.status;
    const lsoNsResource: K8sResourceCommon = {
      apiVersion: apiVersionForModel(NamespaceModel) as K8sResourceCommon['apiVersion'],
      kind: 'Namespace',
      metadata: {
        name: LOCAL_STORAGE_NAMESPACE,
      },
    };
    const lsoOpGroupResource: OperatorGroupKind = {
      apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
      kind: 'OperatorGroup',
      metadata: {
        generateName: `${LOCAL_STORAGE_NAMESPACE}-`,
        namespace: LOCAL_STORAGE_NAMESPACE,
      },
      spec: {
        targetNamespaces: [LOCAL_STORAGE_NAMESPACE],
      },
    };
    const lsoSubscriptionResource: SubscriptionKind = {
      apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: LOCAL_STORAGE_NAMESPACE,
      },
      spec: {
        source: catalogSource,
        sourceNamespace: catalogSourceNamespace,
        name: packageName,
        startingCSV: channels.find((ch) => ch.name === defaultChannel).currentCSV,
        channel: defaultChannel,
        installPlanApproval: InstallPlanApproval.Automatic,
      },
    };

    try {
      if (!lsoNs) await k8sCreate(NamespaceModel, lsoNsResource);
      if (!lsoOpGroup.items?.length) await k8sCreate(OperatorGroupModel, lsoOpGroupResource);
      await k8sCreate(SubscriptionModel, lsoSubscriptionResource);
    } catch (err) {
      setLsoInstallStatus(InstallStatus.Failed);
    }
  };

  if (lsoResourcesLoaded && csvLoaded && !madeLsoInstallationCall.current) {
    if (
      lsoResourcesLoadError ||
      !lsoOpGroup.items?.length ||
      csvLoadError?.message === 'Not found'
    ) {
      madeLsoInstallationCall.current = true;
      makeLsoInstallationCall();
    }
  }

  // For errors other than CSV "Not found" error. If it is CSV "Not found" error then no need to display <LSOInstallFailed /> FC,
  // makeLsoInstallationCall() will be called and will install the LSO.
  const loadErrors: boolean = discoveriesLoadError && csvLoadError?.message !== 'Not found';
  // If CSV or Operator gets deleted after successful installation.
  // We will need to display <LSOInstallFailed /> FC.
  const isCsvDeleted: boolean =
    discoveriesLoadError?.message === 'Not found' && lsoInstallStatus === InstallStatus.Succeeded;

  return (
    <ErrorHandler
      loaded={
        discoveriesLoaded && lsoResourcesLoaded && lsoInstallStatus !== InstallStatus.Progressing
      }
      loadingMessage={
        !csvLoaded || !lsoResourcesLoaded
          ? t('ceph-storage-plugin~Checking Local Storage Operator installation')
          : lsoInstallStatus === InstallStatus.Progressing
          ? t(
              'ceph-storage-plugin~Installing the Local Storage Operator. This may take a few minutes.',
            )
          : !discoveriesLoaded && lsoInstallStatus === InstallStatus.Succeeded
          ? t('ceph-storage-plugin~Discovering disks on all hosts. This may take a few minutes.')
          : null
      }
      error={loadErrors || isCsvDeleted || lsoInstallStatus === InstallStatus.Failed}
      errorMessage={
        lsoInstallStatus === InstallStatus.Failed || csvLoadError ? <LSOInstallFailed /> : null
      }
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
      dispatch,
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
