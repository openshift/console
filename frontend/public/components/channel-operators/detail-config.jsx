import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';

import {LoadingInline} from '../utils';
import {SafetyFirst} from '../safety-first';

// Displays a field of a config & enables the user to click
// on the value to edit in a modal.
//
// Eg, choosing an update channel or toggling automatic updates
export class DetailConfig extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      outdated: false
    };
    this._openModal = this._openModal.bind(this);
  }

  componentWillReceiveProps() {
    this._updateOutdated(false);
  }

  _openModal() {
    this.props.modal(_.defaults({}, this.props.modalData, {
      config: this.props.config,
      callbacks: {
        invalidateState: this._updateOutdated.bind(this)
      }
    }));
  }

  _updateOutdated(outdated) {
    this.setState({
      outdated
    });
  }

  render() {
    if (this.props.config) {
      let displayText = this.props.config[this.props.field];
      if (this.props.displayFunction) {
        displayText = this.props.displayFunction(displayText);
      }
      const outdatedClass = this.state.outdated ? 'text-muted': null;
      return this.props.modal ? <a onClick={this._openModal} className={classNames('co-m-modal-link', outdatedClass)}>{displayText}</a> : <span>{displayText}</span>;
    }
    return <LoadingInline />;
  }
}
DetailConfig.propTypes = {
  config: PropTypes.object,
  displayFunction: PropTypes.func,
  modal: PropTypes.func,
  modalData: PropTypes.object,
  field: PropTypes.string.isRequired
};
