import * as React from 'react';
import { Form, Alert, Button, pluralize } from '@patternfly/react-core';
import { Modal } from '@console/shared';
import { k8sCreate } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '@console/local-storage-operator-plugin/src/models';
import {
  LocalVolumeSetInner,
  LocalVolumeSetHeader,
} from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-inner';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-request-data';
import { State, Action } from '../state';
import { DiscoveryDonutChart } from './donut-chart';
import {
  MINIMUM_NODES,
  diskTypeDropdownItems,
  diskModeDropdownItems,
  allNodesSelectorTxt,
} from '../../../../../constants';
import '../../attached-devices.scss';
import { RequestErrors } from '../../../install-wizard/review-and-create';

const makeLocalVolumeSetCall = (
  state: State,
  dispatch: React.Dispatch<Action>,
  setInProgress,
  setErrorMessage,
) => {
  setInProgress(true);
  const requestData = getLocalVolumeSetRequestData(state);
  k8sCreate(LocalVolumeSetModel, requestData)
    .then(() => {
      state.onNextClick();
      setInProgress(false);
      dispatch({ type: 'setFinalStep', value: true });
    })
    .catch((err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
};

export const CreateLocalVolumeSet: React.FC<CreateLocalVolumeSetProps> = ({ state, dispatch }) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  return (
    <>
      <LocalVolumeSetHeader />
      <div className="ceph-ocs-install__form-wrapper">
        <Form noValidate={false} className="ceph-ocs-install__create-sc-form">
          <LocalVolumeSetInner
            state={state}
            dispatch={dispatch}
            diskTypeOptions={diskTypeDropdownItems}
            diskModeOptions={diskModeDropdownItems}
            allNodesHelpTxt={allNodesSelectorTxt}
          />
        </Form>
        <DiscoveryDonutChart state={state} dispatch={dispatch} />
      </div>
      <ConfirmationModal
        state={state}
        dispatch={dispatch}
        setInProgress={setInProgress}
        setErrorMessage={setErrorMessage}
      />
      {state.filteredNodes.length < MINIMUM_NODES && (
        <Alert
          className="co-alert ceph-ocs-install__wizard-alert"
          variant="danger"
          title="Minimum Node Requirement"
          isInline
        >
          The OCS storage cluster require a minimum of 3 nodes for the intial deployment. Only{' '}
          {pluralize(state.filteredNodes.length, 'node')} match to the selected filters. Please
          adjust the filters to include more nodes.
        </Alert>
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type CreateLocalVolumeSetProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConfirmationModal = ({ state, dispatch, setInProgress, setErrorMessage }) => {
  const makeLVSCall = () => {
    dispatch({ type: 'setShowConfirmModal', value: false });
    makeLocalVolumeSetCall(state, dispatch, setInProgress, setErrorMessage);
  };

  const cancel = () => {
    dispatch({ type: 'setShowConfirmModal', value: false });
  };

  return (
    <Modal
      title="Create Storage Class"
      isOpen={state.showConfirmModal}
      onClose={cancel}
      variant="small"
      actions={[
        <Button key="confirm" variant="primary" onClick={makeLVSCall}>
          Yes
        </Button>,
        <Button key="cancel" variant="link" onClick={cancel}>
          Cancel
        </Button>,
      ]}
    >
      {
        "After the volume set and storage class are created you won't be able to go back to this step. Are you sure you want to continue?"
      }
    </Modal>
  );
};
