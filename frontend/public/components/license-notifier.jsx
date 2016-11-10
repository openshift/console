import React from 'react';
import moment from 'moment';

import {coFetchJSON} from '../co-fetch';
import {GlobalNotification} from './global-notification';
import {licenseExpiredModal} from './license-expired-modal';

const expWarningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

class LicenseNotifier extends React.Component {
  constructor() {
    super();
    this.state = {
      expiration: null
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this._queryLicense();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _queryLicense() {
    coFetchJSON('version')
      .then(this._update.bind(this))
      .catch((error) => {
        // fail silently
        // eslint-disable-next-line no-console
        console.error('Could not load Tectonic version', error);
      });
  }

  _update(json) {
    if (!this._isMounted) {
      return;
    }

    this.setState({
      expiration: new Date(json.expiration)
    }, () => {
      if (this._expired()) {
        licenseExpiredModal({
          expiration: this.state.expiration
        });
      }
    });
  }

  _expired() {
    return !this.state.expiration || Date.now() > this.state.expiration;
  }

  _expiresSoon() {
    return this.state.expiration && this.state.expiration - Date.now() < expWarningThreshold;
  }

  render() {
    const actions = <span><a href="/settings/cluster">View the cluster settings</a> or <a href="https://account.tectonic.com">log in to your Tectonic account</a></span>;

    let notification;
    if (!this.state.expiration) {
      notification = null;
    } else if (this._expired()) {
      notification = {
        content: <span>Your license has expired. {actions}</span>,
        title: 'Cluster License Expired'
      };
    } else if (this._expiresSoon()) {
      const timeRemaining = moment(this.state.expiration).fromNow();
      notification = {
        content: <span>Your license will expire {timeRemaining}. {actions}</span>,
        title: 'Cluster License Expires Soon'
      };
    }

    return notification ? <GlobalNotification content={notification.content} title={notification.title} /> : null;
  }
}

export { LicenseNotifier };
