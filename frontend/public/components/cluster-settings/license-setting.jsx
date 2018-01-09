import * as React from 'react';

import {coFetchJSON} from '../../co-fetch';
import {entitlementTitle} from '../license-notifier';
import {updateLicenseModal} from '../modals';
import {SettingsRow, SettingsLabel, SettingsContent} from './cluster-settings';
import {SettingsModalLink} from './settings-modal-link';

export class LicenseSetting extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      outdate: false,
      expiration: null,
      entitlementCount: null,
      entitlementKind: null
    };
    this._openModal = this._openModal.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this._queryLicense();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps() {
    this._updateOutdated(false);
  }

  _queryLicense() {
    coFetchJSON('api/tectonic/version')
      .then(this._update.bind(this))
      .then(this._updateOutdated.bind(this))
      .catch((error) => {
        // fail silently
        this._updateOutdated(false);
        // eslint-disable-next-line no-console
        console.error('Could not load Tectonic version', error);
      });
  }

  _update(json) {
    if (!this._isMounted) {
      return;
    }
    this.setState({
      expiration: json.expiration,
      entitlementCount: json.entitlementCount,
      entitlementKind: json.entitlementKind
    });
  }

  _updateOutdated(outdated) {
    if (!this._isMounted) {
      return;
    }
    this.setState({
      outdated
    });
  }

  _openModal() {
    const modal = updateLicenseModal({
      callbacks: {
        invalidateState: this._updateOutdated.bind(this)
      }
    });

    modal.result.then(this._queryLicense.bind(this)).catch(this._updateOutdated.bind(this, false));
  }

  render() {
    return <SettingsRow>
      <SettingsLabel>Tectonic License:</SettingsLabel>
      <SettingsContent>
        <SettingsModalLink onClick={this._openModal} outdated={this.state.outdated}>{entitlementTitle(this.state.entitlementKind, this.state.entitlementCount)}</SettingsModalLink>
      </SettingsContent>
    </SettingsRow>;
  }
}
