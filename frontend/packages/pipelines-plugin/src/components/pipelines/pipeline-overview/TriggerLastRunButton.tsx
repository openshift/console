import * as React from 'react';
import { Button } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAccessReview } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { rerunPipelineAndStay } from '../../../utils/pipeline-actions';
import { getLatestRun } from '../../../utils/pipeline-augment';
import { usePipelineRunWithUserAnnotation } from '../../pipelineruns/triggered-by';

type TriggerLastRunButtonProps = {
  pipelineRuns: PipelineRunKind[];
  namespace: string;
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipelineRuns,
  namespace,
  impersonate,
}) => {
  const { t } = useTranslation();
  const latestRun = usePipelineRunWithUserAnnotation(
    getLatestRun({ data: pipelineRuns }, 'startTimestamp'),
  );
  const { labelKey, callback, accessReview: utilityAccessReview } = rerunPipelineAndStay(
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
        {t(labelKey)}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastRunButton);
