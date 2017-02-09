import React from 'react';
import { LicenseNotifier } from './license-notifier';

export class GlobalNotifications extends React.Component {
  render() {
    return <div className="co-global-notifications">
      <LicenseNotifier />
    </div>;
  }
}
