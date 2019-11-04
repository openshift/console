import * as React from 'react';
import { connect } from 'react-redux';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { Button } from 'patternfly-react';
import { rerunPipelineAndStay } from '../../../utils/pipeline-actions';
import { PipelineModel } from '../../../models';
import { getLatestRun, PipelineRun } from '../../../utils/pipeline-augment';

type TriggerLastRunButtonProps = {
  pipelineRuns: PipelineRun[];
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipelineRuns,
  impersonate,
}) => {
  const latestRun = getLatestRun({ data: pipelineRuns }, 'startTimestamp');
  const { label, callback, accessReview } = rerunPipelineAndStay(PipelineModel, latestRun);
  const isAllowed = useAccessReview(accessReview, impersonate);
  return (
    isAllowed && (
      <Button variant="secondary" onClick={callback} disabled={pipelineRuns.length === 0}>
        {label}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastRunButton);
