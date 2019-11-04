import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { Button } from 'patternfly-react';
import { rerunPipeline } from '../../../utils/pipeline-actions';
import { PipelineModel } from '../../../models';

type TriggerLastRunButtonProps = {
  pipeline: K8sResourceKind;
  disabled?: boolean;
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipeline,
  impersonate,
  disabled,
}) => {
  const latestRun = _.get(pipeline, ['latestRun'], null);
  const { label, callback, accessReview } = rerunPipeline(PipelineModel, pipeline, latestRun);
  const isAllowed = useAccessReview(accessReview, impersonate);
  return (
    isAllowed && (
      <Button variant="secondary" onClick={callback} disabled={disabled}>
        {label}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastRunButton);
