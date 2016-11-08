import React from 'react';
import { register } from './react-wrapper';
import { LicenseNotifier } from './license-notifier';

class GlobalNotifications extends React.Component {
  render() {
    return <div className="co-global-notifications">
      <LicenseNotifier />
    </div>;
  }
}

register('GlobalNotifications', GlobalNotifications);
export { GlobalNotifications };
