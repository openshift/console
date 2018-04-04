import * as _ from 'lodash-es';
import * as React from 'react';

import {k8sKinds, k8sList} from '../../module/k8s';
import {coFetchJSON} from '../../co-fetch';
import { entitlementTitles, pluralize } from '../utils';
import { fromNow } from '../utils/datetime';
import {SettingsRow} from './cluster-settings';

const expWarningThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days



class LicenseNotifier extends React.Component {
  constructor() {
    super();
    this.state = {
      expiration: null,
      graceExpiration: null,
      entitlementKind: null,
      entitlementCount: null,
      errorMessage: null,
      current: {
        nodes: 0,
        sockets: 0,
        vCPUs: 0
      }
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
    coFetchJSON('api/tectonic/version')
      .then(this._update.bind(this))
      .catch((error) => {
        // fail silently
        // eslint-disable-next-line no-console
        console.error('Could not load Tectonic version', error);
      });

    k8sList(k8sKinds.Node)
      .then((nodes) => {
        this.setState({
          current: {
            nodes: nodes.length || 0,
            sockets: 0,
            vCPUs: nodes.reduce((sum, node) => {
              return sum + parseInt(_.get(node, 'status.capacity.cpu', 0), 10);
            }, 0)
          }
        });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Could not load Tectonic nodes for license validation', error);
      });
  }

  _update(json) {
    if (!this._isMounted) {
      return;
    }

    this.setState({
      expiration: new Date(json.expiration),
      graceExpiration: new Date(json.graceExpiration),
      entitlementKind: json.entitlementKind,
      entitlementCount: json.entitlementCount,
      errorMessage: json.errorMessage
    });
  }

  _errored() {
    return this.state.errorMessage && this.state.errorMessage.length > 0;
  }

  _expired() {
    return !this.state.expiration || Date.now() > this.state.expiration;
  }

  _expiresSoon() {
    return this.state.expiration && this.state.expiration - Date.now() < expWarningThreshold;
  }

  _graceExpired() {
    return this.state.graceExpiration && Date.now() > this.state.graceExpiration;
  }

  _entitlementExceeded() {
    return this.state.entitlementKind && this.state.current[this.state.entitlementKind] > this.state.entitlementCount;
  }

  render() {
    // eslint-disable-next-line react/jsx-no-target-blank
    const actions = <span>To retrieve a new license file, <a href="https://account.coreos.com" target="_blank" rel="noopener">log in to your Tectonic account</a>.</span>;

    let notification = null;
    if (this._errored()) {
      notification = <span>You have an invalid license. {actions}</span>;
    } else if (!this.state.expiration) {
      notification = null;
    } else if (this._expired()) {
      notification = <span>Your license has expired. {actions}</span>;
    } else if (this._expiresSoon()) {
      const timeRemaining = fromNow(this.state.expiration);
      notification = <span>Your license will expire {timeRemaining}. {actions}</span>;
    } else if (this._entitlementExceeded()) {
      notification = <div>
        Licensed {entitlementTitles[this.state.entitlementKind].uppercase}s Exceeded
        <br />
        Please disconnect {pluralize(this.state.current[this.state.entitlementKind] - this.state.entitlementCount, entitlementTitles[this.state.entitlementKind].lowercase)} from your cluster, or contact <a href="mailto:sales@tectonic.com">sales@tectonic.com</a> to upgrade.
      </div>;
    }

    if (!notification) {
      return null;
    }

    return <SettingsRow>
      <div className="col-xs-12">
        <div className="alert text-warning bg-warning" style={{marginTop: 16}}>{notification}</div>
      </div>
    </SettingsRow>;
  }
}

export { LicenseNotifier };
