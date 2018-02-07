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

    this.setState({active: false, selectedKey: key, title: this.props.items[key]});
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

const Caret = () => <span className="caret"></span>;

/** @augments {React.Component<any>} */
export class Dropdown extends DropdownMixin {
  constructor (props) {
    super(props);
    this.state.cursor = 0;
    this.state.items = props.items;
    this.state.title = props.noSelection ? props.title : _.get(props.items, props.selectedKey, props.title);
    this.onKeyDown = e => this.onKeyDown_(e);
    this.changeTextFilter = e => {
      const autocompleteText = e.target.value;
      let { items, autocompleteFilter } = this.props;
      if (autocompleteFilter && !_.isEmpty(autocompleteText)) {
        items = _.pickBy(items, (item, key) => autocompleteFilter(autocompleteText, item, key));
      }
      this.setState({autocompleteText, items});
    };
    const {shortCut} = this.props;
    this.globalKeyDown = e => {
      const { nodeName } = e.target;

      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        return;
      }

      if (!shortCut || e.key !== shortCut) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      this.show(e);
    };
  }

  componentDidMount () {
    super.componentDidMount();
    if (this.props.shortCut) {
      window.addEventListener('keydown', this.globalKeyDown);
    }
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    window.removeEventListener('keydown', this.globalKeyDown);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;

    if (_.isEqual(nextProps.items, props.items) && nextProps.title === props.title) {
      return;
    }

    const title = nextProps.title || props.title;

    const { autocompleteText } = this.state;
    let { items, autocompleteFilter } = nextProps;
    if (autocompleteFilter && !_.isEmpty(autocompleteText)) {
      items = _.pickBy(items, (item, key) => autocompleteFilter(autocompleteText, item, key));
    }
    this.setState({items, title});
  }

  componentDidUpdate (prevProps, prevState) {
    // kans: we have to move the carret to the end for some presently unknown reason
    if (!prevState.active && this.state.active && this.input) {
      const position = this.state.autocompleteText && this.state.autocompleteText.length;
      this.input.setSelectionRange(position, position);
    }
  }
  onKeyDown_ (e) {
    const { key } = e;
    if (key === 'Escape') {
      this.hide(e);
      return;
    }

    if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter') {
      return;
    }

    const { items, selectedKey } = this.state;

    if (key === 'Enter') {
      this.onClick_(selectedKey, e);
      return;
    }

    const keys = _.keys(items);
    let index = _.indexOf(keys, selectedKey);

    if (key === 'ArrowDown') {
      index += 1;
    } else {
      index -= 1;
    }

    // periodic boundaries
    if (index >= keys.length ) {
      index = 0;
    }
    if (index < 0) {
      index = keys.length - 1;
    }


    const newKey = keys[index];
    this.setState({selectedKey: newKey});
    e.stopPropagation();
  }

  render() {
    const {active, autocompleteText, selectedKey, items, title} = this.state;
    const {autocompleteFilter, autocompletePlaceholder, noButton, noSelection, className, menuClassName} = this.props;

    const button = noButton
      ? <div onClick={this.toggle} className="dropdown__not-btn">
        <span className="dropdown__not-btn__title">{title}</span>&nbsp;<Caret />
      </div>
      : <button onClick={this.toggle} type="button" className="btn btn--dropdown">
        <div className="btn--dropdown__content-wrap">
          {title}&nbsp;&nbsp;<Caret />
        </div>
      </button>;

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
          {
            active && <div className={classNames('dropdown-menu', menuClassName)}>
              {
                autocompleteFilter && <input
                  ref={input => this.input = input}
                  onChange={this.changeTextFilter}
                  placeholder={autocompletePlaceholder}
                  value={autocompleteText || ''}
                  onKeyDown={this.onKeyDown}
                  autoFocus={true}
                  type="text"
                  style={{marginBottom: 10, color: '#000'}}
                  className="form-control text-filter"
                  onClick={e => e.stopPropagation()} />
              }
              <ul style={{margin: 0, padding: 0}}>{children}</ul>
            </div>
          }
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
  textFilter: PropTypes.bool,
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
