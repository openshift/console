import React from 'react';

import {coFetchJSON} from '../../co-fetch';
import {updateLicenseModal} from '../modals/update-license-modal';
import {SettingsRow, SettingsLabel, SettingsContent} from './cluster-settings';
import {SettingsModalLink} from './settings-modal-link';

export class LicenseSetting extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      outdate: false,
      expiration: null,
      tier: null
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
    coFetchJSON('version')
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
      tier: json.tier
    });
  }

  _tierName() {
    return _.words(this.state.tier).map(function(word) { return _.capitalize(word); }).join(' ');
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
        <SettingsModalLink onClick={this._openModal} outdated={this.state.outdated}>{this._tierName()}</SettingsModalLink>
      </SettingsContent>
    </SettingsRow>;
  }
}
