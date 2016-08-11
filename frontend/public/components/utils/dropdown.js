import React from 'react';

export class DropdownMixin extends React.Component {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = {
      title: props.title,
      active: !!props.active,
    };
  }

  _onWindowClick ( event ) {
    if (!this.state.active ) {
      return;
    }
    const {dropdownElement} = this.refs;

    if( event.target === dropdownElement || dropdownElement.contains(event.target)) {
      return;
    }
    this.hide();
  }

  componentDidMount () {
    window.addEventListener('click', this.listener);
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.listener);
  }

  onClick_ (name, e) {
    e.stopPropagation();

    const {onChange} = this.props;
    if (onChange) {
      onChange(name);
    }

    this.setState({active: false, title: name});
  }

  toggle (e) {
    e && e.stopPropagation();
    this.setState({active: !this.state.active});
  }

  show (e) {
    e && e.stopPropagation();
    this.setState({active: true});
  }

  hide (e) {
    e && e.stopPropagation();
    this.setState({active: false});
  }
}

export default class Dropdown extends DropdownMixin {
  render() {
    const {title} = this.state;
    const {nobutton, items, className} = this.props;

    let button = <button onClick={this.toggle.bind(this)} type="button" className="btn btn--dropdown">
      {title}&nbsp;&nbsp;
      <span className="caret"> </span>
    </button>;

    if (nobutton) {
      button = <span onClick={this.toggle.bind(this)} className="dropdown__not-btn">{title}&nbsp;&nbsp;<span className="caret"></span></span>;
    }

    const children = _.map(items, (value, name) => {
      const klass = name === title ? 'dropdown__selected' : 'dropdown__default';
      const onClick_ = this.onClick_.bind(this, name);
      return <li className={klass} key={name}><a onClick={onClick_}>{name}</a></li>;
    });

    return (
      <div className={className} ref="dropdownElement">
        <div className="dropdown">
          {button}
          <ul className="dropdown-menu" aria-labelledby="dLabel" style={{display: this.state.active ? 'block' : 'none'}}>{children}</ul>
        </div>
      </div>
    );
  }
};
