import * as React from 'react';
import * as classNames from'classnames';

export class TogglePlay extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!['className', 'active', 'onClick'].find(prop => nextProps[prop] !== this.props[prop]);
  }

  render() {
    const klass = classNames('co-toggle-play fa', this.props.className, this.props.active ? 'co-toggle-play--active' : 'co-toggle-play--inactive');
    return <button className={klass} onClick={this.props.onClick}></button>;
  }
}
TogglePlay.PropTypes = {
  active: React.PropTypes.bool.isRequired,
  className: React.PropTypes.string,
  onClick: React.PropTypes.func.isRequired
};
