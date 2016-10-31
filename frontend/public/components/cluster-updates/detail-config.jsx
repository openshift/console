import React from 'react';
import classNames from 'classnames';

import {LoadingInline} from '../utils';
import {angulars} from '../react-wrapper';

export class DetailConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      outdated: false
    };
  }

  componentWillReceiveProps() {
    this._updateOutdated(false);
  }

  _openModal() {
    angulars.modal(this.props.modal, _.defaults({}, this.props.modalData, {
      config: this.props.config.data,
      callbacks: {
        invalidateState: this._updateOutdated.bind(this)
      }
    }))();
  }

  _updateOutdated(outdated) {
    this.setState({
      outdated
    });
  }

  render() {
    if (this.props.config && this.props.config.loaded) {
      const config = this.props.config.data;
      if (config) {
        let displayText = config[this.props.field];
        if (this.props.displayFunction) {
          displayText = this.props.displayFunction(displayText);
        }
        const outdatedClass = this.state.outdated ? 'text-muted': null;
        return <a onClick={this._openModal.bind(this)} className={classNames('co-m-modal-link', outdatedClass)}>{displayText}</a>;
      }
      return <span>Unknown</span>;
    }
    return <LoadingInline />;
  }
}
DetailConfig.propTypes = {
  config: React.PropTypes.object,
  displayFunction: React.PropTypes.func,
  modal: React.PropTypes.string.isRequired,
  modalData: React.PropTypes.object,
  field: React.PropTypes.string.isRequired
};
