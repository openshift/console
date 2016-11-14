import React from 'react';

export class DropdownMixin extends React.Component {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = {
      selectedHtml: props.title,
      active: !!props.active,
    };
    this.toggle = this.toggle.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
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

  onClick_ (key, html, e) {
    e.stopPropagation();

    const {onChange} = this.props;
    if (onChange) {
      onChange(key);
    }

    this.setState({active: false, selectedHtml: html});
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

export class Dropdown extends DropdownMixin {
  render() {
    const {selectedHtml} = this.state;
    const {nobutton, items, className} = this.props;

    let button = <button onClick={this.toggle} type="button" className="btn btn--dropdown">
      {selectedHtml}&nbsp;&nbsp;
      <span className="caret"> </span>
    </button>;

    if (nobutton) {
      button = <span onClick={this.toggle} className="dropdown__not-btn">{selectedHtml}&nbsp;&nbsp;<span className="caret"></span></span>;
    }

    const children = _.map(items, (html, key) => {
      const klass = html === selectedHtml ? 'dropdown__selected' : 'dropdown__default';
      const onClick_ = this.onClick_.bind(this, key, html);
      return <li className={klass} key={key}><a onClick={onClick_}>{html}</a></li>;
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
}
