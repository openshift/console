import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Button } from '@patternfly/react-core';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { rerunPipelineAndStay } from '../../../utils/pipeline-actions';
import { PipelineRunModel } from '../../../models';
import { usePipelineRunWithUserLabel } from '../../pipelineruns/triggered-by';
import { getLatestRun, PipelineRun } from '../../../utils/pipeline-augment';

type TriggerLastRunButtonProps = {
  pipelineRuns: PipelineRun[];
  namespace: string;
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipelineRuns,
  namespace,
  impersonate,
}) => {
  const latestRun = usePipelineRunWithUserLabel(
    getLatestRun({ data: pipelineRuns }, 'startTimestamp'),
  );
  const { label, callback, accessReview: utilityAccessReview } = rerunPipelineAndStay(
    PipelineRunModel,
    latestRun,
  );
  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace,
    verb: 'create',
  };
  const accessReview = _.isEmpty(utilityAccessReview) ? defaultAccessReview : utilityAccessReview;
  const isAllowed = useAccessReview(accessReview, impersonate);
  return (
    isAllowed && (
      <Button
        variant="secondary"
        onClick={callback}
        isDisabled={pipelineRuns.length === 0 && !callback}
      >
        {label}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastRunButton);
