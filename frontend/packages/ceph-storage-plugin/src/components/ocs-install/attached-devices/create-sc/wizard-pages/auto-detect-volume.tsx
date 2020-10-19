import * as React from 'react';
import { Form } from '@patternfly/react-core';
import {
  AutoDetectVolumeInner,
  AutoDetectVolumeHeader,
} from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/auto-detect-volume-inner';
import { State, Action } from '../state';
import '../../attached-devices.scss';
import { RequestErrors } from '../../../install-wizard/review-and-create';

export const AutoDetectVolume: React.FC<AutoDetectVolumeProps> = ({ state, dispatch }) => (
  <>
    <AutoDetectVolumeHeader />
    <Form noValidate={false} className="ceph-ocs-install__auto-detect-table">
      <AutoDetectVolumeInner state={state} dispatch={dispatch} />
    </Form>
    <RequestErrors errorMessage={state.error} inProgress={state.isLoading} />
  </>
);

type AutoDetectVolumeProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
