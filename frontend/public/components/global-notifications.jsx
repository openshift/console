import * as React from 'react';

import { ImpersonateNotifier } from './impersonate-notifier';
import { KubeAdminNotifier } from './kube-admin-notifier';

export const GlobalNotifications = () => (
  <div className="co-global-notifications" data-test="global-notifications">
    <KubeAdminNotifier />
    <ImpersonateNotifier />
  </div>
);
