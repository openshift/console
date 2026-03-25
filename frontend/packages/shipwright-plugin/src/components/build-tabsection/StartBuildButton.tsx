import type { FC } from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { impersonateStateToProps, useAccessReview } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import type { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { startBuild } from '../../api';
import { BuildRunModel } from '../../models';
import type { Build } from '../../types';

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

type StartBuildButtonProps = {
  build: Build;
  namespace: string;
};

const StartBuildButton: FC<StartBuildButtonProps & StateProps> = ({
  build,
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

  const onClick = () => {
    startBuild(build).catch((err) => {
      const error = err.message;
      launchModal(ErrorModal, { error });
    });
  };

  return (
    isAllowed && (
      <Button variant="secondary" onClick={onClick}>
        {t('shipwright-plugin~Start Build')}
      </Button>
    )
  );
};

export default connect(impersonateStateToProps)(StartBuildButton);
