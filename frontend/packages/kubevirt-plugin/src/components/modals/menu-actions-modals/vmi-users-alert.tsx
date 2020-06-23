import * as React from 'react';
import { Alert, Button, pluralize } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
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
    <>
      <Button variant="link" isInline onClick={onLinkClick}>
        {pluralize(userListLength, 'User')}
      </Button>{' '}
      currently logged in to this VM. Proceeding with this operation may cause logged in users to
      lose data.
    </>
  );

  return (
    userListLength > 0 && (
      <div className="kubevirt-confirm-vmi-model__alert">
        <Alert isInline variant="warning" title={alertTitle || 'Alert'}>
          {alertBody}
        </Alert>
      </div>
    )
  );
};
