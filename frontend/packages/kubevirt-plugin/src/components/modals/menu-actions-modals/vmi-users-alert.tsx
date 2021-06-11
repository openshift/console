import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { history } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { Alert, Button } from '@patternfly/react-core';

import { useGuestAgentInfo } from '../../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMIKind } from '../../../types';

import './vmi-users-alert.scss';

type VMIUsersAlertProps = {
  vmi: VMIKind;
  alertTitle?: string;
  cancel: () => void;
  alertHref?: string;
};

export const VMIUsersAlert: React.FC<VMIUsersAlertProps> = ({
  vmi,
  cancel,
  alertTitle,
  alertHref,
}) => {
  const { t } = useTranslation();
  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const userListLength = guestAgentInfo.getNumLoggedInUsers();

  const name = getName(vmi);
  const namespace = getNamespace(vmi);
  const defaultAlertHref = `/k8s/ns/${namespace}/virtualmachines/${name}/details#logged-in-users`;
  const onLinkClick = () => {
    cancel();
    history.push(alertHref || defaultAlertHref);
  };

  const alertBody = (
    <Trans t={t} ns="kubevirt-plugin" count={userListLength}>
      <Button variant="link" isInline onClick={onLinkClick}>
        {{ count: userListLength }} User
      </Button>{' '}
      currently logged in to this VM. Proceeding with this operation may cause logged in users to
      lose data.
    </Trans>
  );

  return (
    userListLength > 0 && (
      <div className="kubevirt-confirm-vmi-model__alert">
        <Alert isInline variant="warning" title={alertTitle || t('kubevirt-plugin~Alert')}>
          {alertBody}
        </Alert>
      </div>
    )
  );
};
