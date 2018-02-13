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
    if (event.target === this.dropdownElement || this.dropdownElement.contains && this.dropdownElement.contains(event.target)) {
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

const Caret = () => <span className="caret" />;

class DropDownRow extends React.PureComponent {
  render () {
    const {itemKey, content, onclick, onBookmark, onUnBookmark, className, selected, hover} = this.props;
    let prefix;
    if (onUnBookmark) {
      prefix = <a className="bookmarker" onClick={e => onUnBookmark(e, itemKey)}><i className="fa fa-minus-circle" /></a>;
    }
    if (onBookmark) {
      prefix = <a className="bookmarker" onClick={e => onBookmark(e, itemKey, content)}><i className="fa fa-plus-circle" /></a>;
    }
    return <li className={className} key={itemKey} style={{display: 'flex', flexDirection: 'row'}}>
      {prefix}<a ref={ref => this.ref=ref} className={classNames({'next-to-bookmark': !!prefix,focus: selected, hover})} onClick={e => onclick(itemKey, e)}>{content}</a>
    </li>;
  }
}

/** @augments {React.Component<any>} */
export class Dropdown extends DropdownMixin {
  constructor (props) {
    super(props);
    this.onUnBookmark = (...args) => this.onUnBookmark_(...args);
    this.onBookmark = (...args) => this.onBookmark_(...args);
    this.onClick = (...args) => this.onClick_(...args);

    let bookmarks = props.defaultBookmarks || {};
    if (props.bookmarkKey) {
      try {
        const loaded = JSON.parse(localStorage.getItem(this.storageKey));
        if (_.isPlainObject(loaded)) {
          bookmarks = loaded;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`could not load bookmarks for ${this.storageKey}: ${e}`);
      }
    }

    this.state.bookmarks = bookmarks;

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

  get storageKey () {
    return `bookmarks-${this.props.bookmarkKey}`;
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

    const { items, keyboardHoverKey } = this.state;

    if (key === 'Enter') {
      if (!keyboardHoverKey) {
        this.hide(e);
        return;
      }
      this.onClick_(keyboardHoverKey, e);
      return;
    }

    // reconstruct the correct order (bookmarks go first)
    const { bookmarks } = this.state;
    // put the visible, bookmarked items in the front of the list and sort it
    const keys = _.intersection(_.keys(items), _.keys(bookmarks)).sort();
    _.keys(items).forEach(b => {
      if (bookmarks[b]) {
        return;
      }
      // push the rest of the non-bookmarked items to the end
      keys.push(b);
    });

    let index = _.indexOf(keys, keyboardHoverKey);

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
    this.setState({keyboardHoverKey: newKey});
    e.stopPropagation();
  }
  onUnBookmark_ (e, key) {
    e.stopPropagation();

    const bookmarks = Object.assign({}, this.state.bookmarks);
    delete bookmarks[key];
    this.setState({bookmarks});
    localStorage.setItem(this.storageKey, JSON.stringify(bookmarks));
  }

  onBookmark_ (e, key, value) {
    e.stopPropagation();

    const bookmarks = Object.assign({}, this.state.bookmarks);
    bookmarks[key] = value;
    this.setState({bookmarks});
    localStorage.setItem(this.storageKey, JSON.stringify(bookmarks));
  }

  render() {
    const {active, autocompleteText, selectedKey, items, title, bookmarks, keyboardHoverKey} = this.state;
    const {autocompleteFilter, autocompletePlaceholder, noButton, noSelection, className, menuClassName, bookmarkKey} = this.props;

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

    const rows = [];
    const bookMarkRows = [];

    _.each(items, (content, key) => {
      const selected = !noSelection && key === selectedKey;
      const hover = key === keyboardHoverKey;
      const klass = classNames({'dropdown__selected': selected});
      if (bookmarkKey && bookmarks && bookmarks[key]) {
        bookMarkRows.push(<DropDownRow className={klass} key={key} itemKey={key} content={content} onUnBookmark={this.onUnBookmark} onclick={this.onClick} selected={selected} hover={hover} />);
        return;
      }
      if (spacerBefore.has(key)) {
        rows.push(<li key={`${key}-spacer`}><div className="dropdown-menu__divider" /></li>);
      }
      rows.push(<DropDownRow className={klass} key={key} itemKey={key} content={content} onBookmark={bookmarkKey && this.onBookmark} onclick={this.onClick} selected={selected} hover={hover} />);
    });

    return (
      <div className={className} ref={this.setNode} style={this.props.style}>
        <div className="dropdown">
          {button}
          {
            active && <div className={classNames('dropdown-menu', menuClassName)}>
              {
                autocompleteFilter && <input
                  autoFocus
                  type="text"
                  ref={input => this.input = input}
                  onChange={this.changeTextFilter}
                  placeholder={autocompletePlaceholder}
                  value={autocompleteText || ''}
                  onKeyDown={this.onKeyDown}
                  className="form-control dropdown--text-filter"
                  onClick={e => e.stopPropagation()} />
              }
              <ul>
                { bookMarkRows }
                {_.size(bookMarkRows) ? <li><div className="dropdown-menu__divider" /></li> : null}
              </ul>
              <ul style={{margin: 0, padding: 0}}>{rows}</ul>
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
  textFilter: PropTypes.string,
  enableBookmarks: PropTypes.bool,
  defaultBookmarks: PropTypes.objectOf(PropTypes.string),
  bookmarkKey: PropTypes.string,
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
