import React from 'react';
import classNames from 'classnames';

export class NumberSpinner extends React.Component {
  constructor(props) {
    super(props);
    this._setValue = this._setValue.bind(this);
  }

  _setValue(event) {
    const operation = event.target.className.includes('minus') ? -1 : 1;
    this.props.changeValueBy(operation);
  }

  render() {
    const props = _.omit(this.props, ['className', 'changeValueBy']);
    const className = classNames(this.props.className, 'co-m-number-spinner__input');

    return <div>
      <i className="fa fa-minus-square co-m-number-spinner__down-icon" onClick={this._setValue}></i>
      <input type="number" className={className} {...props} />
      <i className="fa fa-plus-square co-m-number-spinner__up-icon" onClick={this._setValue}></i>
    </div>;
  }
}
NumberSpinner.propTypes = {
  // function that increments/decrements the existing value
  changeValueBy: React.PropTypes.func.isRequired
};
