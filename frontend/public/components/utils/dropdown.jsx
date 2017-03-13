import React from 'react';
import classNames from 'classnames';

import { history } from './index';

export class DropdownMixin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = {active: !!props.active};
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

  onClick_ (key, e) {
    e.stopPropagation();

    const {onChange} = this.props;
    if (onChange) {
      onChange(key);
    }

    this.setState({active: false, selectedKey: key});
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
    const {active, selectedKey} = this.state;
    const {noButton, noSelection, items, title, className, menuClassName} = this.props;

    const buttonTitle = noSelection || selectedKey === undefined ? title : items[selectedKey];
    let button = <button onClick={this.toggle} type="button" className="btn btn--dropdown">
      <div className="btn--dropdown__content-wrap">
        {buttonTitle}&nbsp;&nbsp;
        <span className="caret"></span>
      </div>
    </button>;

    if (noButton) {
      button = <span onClick={this.toggle} className="dropdown__not-btn">{buttonTitle}&nbsp;<span className="caret"></span></span>;
    }

    const children = _.map(items, (html, key) => {
      const klass = noSelection || key !== selectedKey ? 'dropdown__default' : 'dropdown__selected';
      const onClick_ = this.onClick_.bind(this, key);
      return <li className={klass} key={key}><a onClick={onClick_}>{html}</a></li>;
    });

    return (
      <div className={className} ref="dropdownElement">
        <div className="dropdown">
          {button}
          <ul className={classNames('dropdown-menu', menuClassName)} style={{display: active ? 'block' : 'none'}}>{children}</ul>
        </div>
      </div>
    );
  }
}

export const sortActions = actions => _.sortBy(actions, a => [a.weight || 0, a.label]);

export const ActionsMenu = ({actions}) => {
  const shownActions = sortActions(_.reject(actions, o => _.get(o, 'hidden', false)));
  const items = _.fromPairs(_.map(shownActions, (v, k) => [k, v.label]));
  const title = <span className="btn--actions__title"><i className="fa fa-cog btn--actions__cog"></i><span className="btn--actions__label">Actions</span></span>;
  const onChange = key => {
    const action = shownActions[key];
    if (action.callback) {
      return action.callback();
    }
    if (action.href) {
      history.push(action.href);
    }
  };
  return <Dropdown className="btn--actions" menuClassName="btn--actions__menu co-m-dropdown--dark" items={items} title={title} onChange={onChange} noSelection={true} />;
};
