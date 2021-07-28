import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Alert, Button, Grid, GridItem, WizardContextConsumer } from '@patternfly/react-core';
import { Modal, useFlag } from '@console/shared';
import { k8sCreate, NodeKind } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '@console/local-storage-operator-plugin/src/models';
import { LocalVolumeSetBody } from '@console/local-storage-operator-plugin/src/components/local-volume-set/body';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/request';
import { getNodesByHostNameLabel } from '@console/local-storage-operator-plugin/src/utils';
import { SelectedCapacity } from './selected-capacity';
import { GUARDED_FEATURES } from '../../../../../features';
import { hasOCSTaint } from '../../../../../utils/install';
import {
  MINIMUM_NODES,
  diskModeDropdownItems,
  arbiterText,
  OCS_TOLERATION,
} from '../../../../../constants';
import { RequestErrors } from '../../../install-wizard/review-and-create';
import '../../attached-devices.scss';
import { State, Action } from '../../reducer';

const makeLocalVolumeSetCall = (
  state: State,
  dispatch: React.Dispatch<Action>,
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  ns: string,
  onNext: () => void,
  lvsNodes: NodeKind[],
) => {
  setInProgress(true);

  const nodes = getNodesByHostNameLabel(lvsNodes);

  const requestData = getLocalVolumeSetRequestData(state, nodes, ns, OCS_TOLERATION);
  k8sCreate(LocalVolumeSetModel, requestData)
    .then(() => {
      dispatch({
        type: 'setStorageClassName',
        name: state.storageClassName || state.volumeSetName,
      });
      setInProgress(false);
      onNext();
    })
    .catch((err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
};

export const CreateStorageClass: React.FC<CreateStorageClassProps> = ({ state, dispatch, ns }) => {
  const { t } = useTranslation();

  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const allNodesSelectorTxt = t(
    'ceph-storage-plugin~Uses the available disks that match the selected filters on all nodes selected in the previous step.',
  );
  const lvsNameSelectorTxt = t(
    'ceph-storage-plugin~A LocalVolumeSet allows you to filter a set of disks, group them and create a dedicated StorageClass to consume storage from them.',
  );
  const lvsNodes = state.lvsIsSelectNodes ? state.lvsSelectNodes : state.lvsAllNodes;

  return (
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
        setErrorMessage={setErrorMessage}
      />
      {state.chartNodes.size < MINIMUM_NODES && (
        <Alert
          className="co-alert ceph-ocs-install__wizard-alert"
          variant="danger"
          title={t('ceph-storage-plugin~Minimum Node Requirement')}
          isInline
        >
          {t(
            "ceph-storage-plugin~OpenShift Container Storage's StorageCluster requires a minimum of 3 nodes for the initial deployment. Only {{nodes}} node match to the selected filters. Please adjust the filters to include more nodes.",
            { nodes: state.chartNodes.size },
          )}
        </Alert>
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type CreateStorageClassProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  ns: string;
};

const ConfirmationModal = ({ state, dispatch, setInProgress, setErrorMessage, ns, lvsNodes }) => {
  const { t } = useTranslation();
  const isArbiterSupported = useFlag(GUARDED_FEATURES.OCS_ARBITER);
  return (
    <WizardContextConsumer>
      {({ onNext }) => {
        const makeLVSCall = () => {
          dispatch({ type: 'setShowConfirmModal', value: false });
          makeLocalVolumeSetCall(
            state,
            dispatch,
            setInProgress,
            setErrorMessage,
            ns,
            onNext,
            lvsNodes,
          );
        };

        const cancel = () => {
          dispatch({ type: 'setShowConfirmModal', value: false });
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
      }}
    </WizardContextConsumer>
  );
};
