import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAccessReview } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { PipelineRunModel } from '../../../models';
import { PipelineKind } from '../../../types';
import { startPipelineModal } from '../modals';

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

type PipelineStartButtonProps = {
  pipeline: PipelineKind;
  namespace: string;
};

const PipelineStartButton: React.FC<PipelineStartButtonProps & StateProps> = ({
  pipeline,
  namespace,
  impersonate,
}) => {
  const { t } = useTranslation();
  const openPipelineModal = () =>
    startPipelineModal({
      pipeline,
      modalClassName: 'modal-lg',
    });
  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace,
    verb: 'create',
  };
  const isAllowed = useAccessReview(defaultAccessReview, impersonate);

  return (
    isAllowed && (
      <Button variant="secondary" onClick={openPipelineModal}>
        {t('pipelines-plugin~Start')}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(PipelineStartButton);
