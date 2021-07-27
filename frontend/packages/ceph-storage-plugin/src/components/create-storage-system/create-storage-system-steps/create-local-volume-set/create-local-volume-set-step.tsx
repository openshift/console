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
  LocalVolumeDiscovery,
  LocalVolumeSetModel,
} from '@console/local-storage-operator-plugin/src/models';
import { getNodesByHostNameLabel } from '@console/local-storage-operator-plugin/src/utils';
import { useFlag } from '@console/shared/src';
import { k8sCreate, k8sGet, k8sList, NodeKind } from '@console/internal/module/k8s';
import { createLocalVolumeDiscovery } from '@console/local-storage-operator-plugin/src/components/local-volume-discovery/request';
import { NodeModel } from '@console/internal/models';
import { DISCOVERY_CR_NAME } from '@console/local-storage-operator-plugin/src/constants';
import { LocalVolumeSetBody } from './body';
import { SelectedCapacity } from './selected-capacity';
import { GUARDED_FEATURES } from '../../../../features';
import {
  arbiterText,
  diskModeDropdownItems,
  LSO_OPERATOR,
  MINIMUM_NODES,
  OCS_TOLERATION,
} from '../../../../constants';
import { ErrorHandler } from '../../error-handler';
import { WizardDispatch, WizardState } from '../../reducer';
import { useFetchCsv } from '../../use-fetch-csv';
import { RequestErrors } from '../../../ocs-install/install-wizard/review-and-create';
import { hasOCSTaint } from '../../../../utils/install';

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
  lvsNodes: NodeKind[],
) => {
  setInProgress(true);

  const nodes = getNodesByHostNameLabel(lvsNodes);

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

export const CreateLocalVolumeSet: React.FC<CreateLocalVolumeSetProps> = ({
  state,
  storageClass,
  dispatch,
}) => {
  const [csv, csvLoaded, csvLoadError] = useFetchCsv(LSO_OPERATOR);
  const { t } = useTranslation();
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lvdInProgress, setLvdInProgress] = React.useState(false);
  const [lvdError, setLvdError] = React.useState(null);

  React.useEffect(() => {
    const createLvd = async () => {
      try {
        setLvdInProgress(true);
        await k8sGet(LocalVolumeDiscovery, DISCOVERY_CR_NAME, csv?.metadata?.namespace);
      } catch (e) {
        if (e?.response?.status === 404) {
          try {
            const nodes = await k8sList(NodeModel);
            const nodeByHostNames: string[] = getNodesByHostNameLabel(nodes.items);
            await createLocalVolumeDiscovery(
              nodeByHostNames,
              csv?.metadata?.namespace,
              OCS_TOLERATION,
            );
          } catch (createError) {
            setLvdError(createError.message);
          }
        }
      } finally {
        setLvdInProgress(false);
      }
    };
    if (!csvLoadError && csvLoaded) {
      createLvd();
    }
  }, [csv, csvLoadError, csvLoaded]);

  const allNodesSelectorTxt = t(
    'ceph-storage-plugin~Uses the available disks that match the selected filters on all nodes selected in the previous step.',
  );
  const lvsNameSelectorTxt = t(
    'ceph-storage-plugin~A LocalVolumeSet allows you to filter a set of disks, group them and create a dedicated StorageClass to consume storage from them.',
  );
  const lvsNodes = state.lvsIsSelectNodes ? state.lvsSelectNodes : state.lvsAllNodes;
  const ns = csv?.metadata?.namespace;

  return (
    <ErrorHandler loaded={csvLoaded && !lvdInProgress} error={!csvLoadError ? lvdError : null}>
      {csvLoadError || csv?.status?.phase !== 'Succeeded' ? (
        <Alert
          className="co-alert ceph-ocs-install__lso-install-alert"
          variant="info"
          title={t('ceph-storage-plugin~Local Storage Operator not installed')}
          isInline
        >
          <Trans t={t} ns="ceph-storage-plugin">
            Before we can create a StorageCluster, the Local Storage operator needs to be installed.
            When installation is finished come back to OpenShift Container Storage to create a
            StorageCluster.
            <div className="ceph-ocs-install__lso-alert__button">
              <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
                Install
              </Button>
            </div>
          </Trans>
        </Alert>
      ) : (
        <>
          <Grid className="ceph-ocs-install__form-wrapper">
            <GridItem lg={10} md={12} sm={12}>
              <Form noValidate={false}>
                <LocalVolumeSetBody
                  state={state}
                  dispatch={dispatch}
                  diskModeOptions={diskModeDropdownItems}
                  allNodesHelpTxt={allNodesSelectorTxt}
                  lvsNameHelpTxt={lvsNameSelectorTxt}
                  taintsFilter={hasOCSTaint}
                  storageClassName={storageClass.name}
                />
              </Form>
            </GridItem>
            <GridItem
              lg={2}
              lgOffset={10}
              md={4}
              mdOffset={4}
              sm={4}
              smOffset={4}
              className="ceph-ocs-install__donut-chart"
            >
              <SelectedCapacity dispatch={dispatch} state={state} ns={ns} />
            </GridItem>
          </Grid>
          <ConfirmationModal
            ns={ns}
            lvsNodes={lvsNodes}
            state={state}
            dispatch={dispatch}
            setInProgress={setInProgress}
            setErrorMessage={setError}
            storageClassName={storageClass.name}
          />
          {state.chartNodes.size < MINIMUM_NODES && (
            <Alert
              className="co-alert ceph-ocs-install__wizard-alert"
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
          <RequestErrors errorMessage={error?.message} inProgress={inProgress} />
        </>
      )}
    </ErrorHandler>
  );
};

type CreateLocalVolumeSetProps = {
  state: WizardState['createLocalVolumeSet'];
  storageClass: WizardState['storageClass'];
  dispatch: WizardDispatch;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  state,
  dispatch,
  setInProgress,
  setErrorMessage,
  storageClassName,
  ns,
  lvsNodes,
}) => {
  const { t } = useTranslation();
  const isArbiterSupported = useFlag(GUARDED_FEATURES.OCS_ARBITER);
  const { onNext } = React.useContext<WizardContextType>(WizardContext);

  const cancel = () => {
    dispatch({
      type: 'wizard/setCreateLocalVolumeSet',
      payload: { field: 'showConfirmModal', value: false },
    });
  };

  const makeLVSCall = () => {
    cancel();
    makeLocalVolumeSetCall(
      state,
      storageClassName,
      setInProgress,
      setErrorMessage,
      ns,
      onNext,
      lvsNodes,
    );
  };

  const description = (
    <>
      <span>
        {t(
          "ceph-storage-plugin~After the LocalVolumeSet and StorageClass are created you won't be able to go back to this step.",
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
      title={t('ceph-storage-plugin~Create StorageClass')}
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
  lvsNodes: NodeKind[];
};
