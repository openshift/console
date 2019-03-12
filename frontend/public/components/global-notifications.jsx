import * as React from 'react';

import { KubeAdminNotifier } from './kube-admin-notifier';
import { ConsoleNotifier } from './console-notifier';
import { ImpersonateNotifier } from './impersonate-notifier';

export const GlobalNotifications = () => <div className="co-global-notifications">
  <KubeAdminNotifier />
  <ConsoleNotifier />
  <ImpersonateNotifier />
</div>;
