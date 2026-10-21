import type { FC } from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { impersonateStateToProps, useAccessReview } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import type { AccessReviewResourceAttributes, K8sResourceKind } from '@console/internal/module/k8s';
import { canRerunBuildRun, rerunBuildRun } from '../../api';
import { BuildRunModel } from '../../models';
import type { BuildRun } from '../../types';
import { getLatestBuildRunStatusforDeployment } from '../../utils';

type TriggerLastBuildButtonProps = {
  buildRuns: BuildRun[];
  resource: K8sResourceKind;
  namespace: string;
  impersonate?;
};

const TriggerLastBuildButton: FC<TriggerLastBuildButtonProps> = ({
  buildRuns,
  resource,
  namespace,
  impersonate,
}) => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: BuildRunModel.apiGroup,
    resource: BuildRunModel.plural,
    namespace,
    verb: 'create',
  };
  const [isAllowed] = useAccessReview(defaultAccessReview, impersonate);

  const { latestBuildRun } = getLatestBuildRunStatusforDeployment(buildRuns, resource);
  const onClick = () => {
    rerunBuildRun(latestBuildRun).catch((err) => {
      const error = err.message;
      launchModal(ErrorModal, { error });
    });
  };

  return (
    isAllowed && (
      <Button variant="secondary" onClick={onClick} isDisabled={!canRerunBuildRun(latestBuildRun)}>
        {t('shipwright-plugin~Rerun latest BuildRun')}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(TriggerLastBuildButton);
