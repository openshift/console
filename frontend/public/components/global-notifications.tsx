import * as React from 'react';

import { ImpersonateNotifier } from './impersonate-notifier';
import { KubeAdminNotifier } from './kube-admin-notifier';

export const GlobalNotifications = () => (
  <div data-test="global-notifications">
    <KubeAdminNotifier />
    <ImpersonateNotifier />
  </div>
);
