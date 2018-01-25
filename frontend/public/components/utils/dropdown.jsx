import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from'classnames';
import * as PropTypes from 'prop-types';

import { history } from './index';

export class DropdownMixin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = {active: !!props.active, selectedKey: props.selectedKey};
    this.toggle = this.toggle.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.setNode = this.setNode.bind(this);
  }

  setNode (node) {
    if (node) {
      this.dropdownElement = node;
    }
  }

  _onWindowClick (event) {
    if (!this.state.active) {
      return;
    }
    if (event.target === this.dropdownElement || _.includes(this.dropdownElement, event.target)) {
      return;
    }
    this.hide();
  }

  componentWillReceiveProps({selectedKey}) {
    if (selectedKey !== this.props.selectedKey) {
      this.setState({selectedKey});
    }
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

const AutocompleteInput = props => <input {...props} className="dropdown__autocomplete" autoFocus={true} type="text" />;
const Caret = () => <span className="caret"></span>;

/** @augments {React.Component<any>} */
export class Dropdown extends DropdownMixin {
  constructor (props) {
    super(props);
    this.changeTextFilter = e => this.setState({autocompleteText: e.target.value});
  }

  render() {
    const {active, autocompleteText, selectedKey} = this.state;
    const {autocompleteFilter, autocompletePlaceholder, noButton, noSelection, className, menuClassName} = this.props;
    const isAutocomplete = !!autocompleteFilter && active;

    let items = this.props.items;
    if (isAutocomplete && !_.isEmpty(autocompleteText)) {
      items = _.pickBy(items, (item, key) => autocompleteFilter(autocompleteText, item, key));
    }

    const title = _.isEmpty(autocompleteText) ? this.props.title : <span className="text-muted">{autocompleteText}</span>;
    const buttonTitle = noSelection ? title : _.get(items, selectedKey, title);

    let button;
    if (noButton) {
      button = <div onClick={this.toggle} className="dropdown__not-btn"><span className="dropdown__not-btn__title">{buttonTitle}</span>&nbsp;<Caret /></div>;
    } else {
      button = <button onClick={this.toggle} type="button" className="btn btn--dropdown">
        <div className="btn--dropdown__content-wrap">
          {isAutocomplete
            ? <AutocompleteInput onChange={this.changeTextFilter} placeholder={autocompletePlaceholder} value={autocompleteText || ''} />
            : buttonTitle}&nbsp;&nbsp;<Caret />
        </div>
      </button>;
    }

    const spacerBefore = this.props.spacerBefore || new Set();

    const children = [];
    _.each(items, (html, key) => {
      const klass = classNames({'dropdown__selected': !noSelection && key === selectedKey});
      const onClick_ = this.onClick_.bind(this, key);
      if (spacerBefore.has(key)) {
        children.push(<li key={`${key}-spacer`}><div className="divider"></div></li>);
      }
      children.push(<li className={klass} key={key}><a onClick={onClick_}>{html}</a></li>);
    });

    return (
      <div className={className} ref={this.setNode} style={this.props.style}>
        <div className="dropdown">
          {button}
          {active && !_.isEmpty(children) && <ul className={classNames('dropdown-menu', menuClassName)}>{children}</ul>}
        </div>
      </div>
    );
  }
}

Dropdown.propTypes = {
  autocompleteFilter: PropTypes.func,
  autocompletePlaceholder: PropTypes.string,
  className: PropTypes.string,
  items: PropTypes.object.isRequired,
  menuClassName: PropTypes.string,
  noButton: PropTypes.bool,
  noSelection: PropTypes.bool,
  title: PropTypes.node,
};

export const ActionsMenu = ({actions}) => {
  const shownActions = _.reject(actions, o => _.get(o, 'hidden', false));
  const items = _.fromPairs(_.map(shownActions, (v, k) => [k, v.label]));
  const title = <span className="btn--actions__title"><i className="fa fa-cog btn--actions__cog"></i><span className="btn--actions__label" id="action-dropdown">Actions</span></span>;
  const onChange = key => {
    const action = shownActions[key];
    if (action.callback) {
      return action.callback();
    }
    if (action.href) {
      history.push(action.href);
    }
  };
  return <Dropdown className="btn--actions" menuClassName="btn--actions__menu dropdown--dark" items={items} title={title} onChange={onChange} noSelection={true} />;
};
