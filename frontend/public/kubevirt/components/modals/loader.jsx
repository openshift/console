import * as React from 'react';
import PropTypes from 'prop-types';

const ESC_KEY = 27;

/**
 * Empty loader
 * // TODO: add loading icon
 */
export class Loader extends React.Component {

  constructor(props) {
    super(props);

    this.onKeydown = this.onKeydown.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeydown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown(event) {
    if (event.key === 'Escape' || event.keyCode === ESC_KEY) {
      this.props.onExit(event);
    }
  }

  render() {
    return (
      <div role="dialog-loader" onClick={this.props.onExit} >
        <div className="fade modal-backdrop in no-bgcolor" />
      </div>
    );
  }
}

Loader.propTypes = {
  onExit: PropTypes.func.isRequired,
};
