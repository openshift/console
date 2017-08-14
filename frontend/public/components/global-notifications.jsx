import * as React from 'react';

import { LicenseNotifier } from './license-notifier';
import { ImpersonateNotifier } from './impersonate-notifier';

export const GlobalNotifications = () => <div className="co-global-notifications">
  <LicenseNotifier />
  <ImpersonateNotifier />
</div>;
