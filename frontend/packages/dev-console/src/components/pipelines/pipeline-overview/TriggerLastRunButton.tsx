import * as React from 'react';
import { connect } from 'react-redux';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { Button } from '@patternfly/react-core';
import { rerunPipelineAndStay } from '../../../utils/pipeline-actions';
import { PipelineModel } from '../../../models';
import { usePipelineRunWithUserLabel } from '../../pipelineruns/triggered-by';
import { getLatestRun, PipelineRun } from '../../../utils/pipeline-augment';

type TriggerLastRunButtonProps = {
  pipelineRuns: PipelineRun[];
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipelineRuns,
  impersonate,
}) => {
  const latestRun = usePipelineRunWithUserLabel(
    getLatestRun({ data: pipelineRuns }, 'startTimestamp'),
  );
  const { label, callback, accessReview } = rerunPipelineAndStay(PipelineModel, latestRun);
  const isAllowed = useAccessReview(accessReview, impersonate);
  return (
    isAllowed && (
      <Button variant="secondary" onClick={callback} isDisabled={pipelineRuns.length === 0}>
        {label}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastRunButton);
