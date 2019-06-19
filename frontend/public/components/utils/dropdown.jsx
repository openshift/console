import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { impersonateStateToProps } from '../../reducers/ui';
import { checkAccess, history, KebabItems, ResourceName } from './index';

export class DropdownMixin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = {active: !!props.active, selectedKey: props.selectedKey};
    this.toggle = this.toggle.bind(this);
    this.dropdownElement = React.createRef();
    this.dropdownList = React.createRef();
  }

  _onWindowClick(event) {
    if (!this.state.active) {
      return;
    }

    const { current } = this.dropdownElement;
    if (!current) {
      return;
    }

    if (event.target === current || current && current.contains(event.target)) {
      return;
    }

    this.hide(event);
  }

  componentWillReceiveProps({selectedKey}) {
    if (selectedKey !== this.props.selectedKey) {
      this.setState({selectedKey});
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.listener);
  }

  onClick_(selectedKey, e) {
    e.preventDefault();
    e.stopPropagation();

    const {onChange, noSelection, title} = this.props;

    if (onChange) {
      onChange(selectedKey, e);
    }

    this.setState({
      selectedKey,
      title: noSelection ? title : this.props.items[selectedKey],
    });

    this.hide();
  }

  toggle(e) {
    e.preventDefault();
    if (this.state.active) {
      this.hide(e);
    } else {
      this.show(e);
    }
  }

  show() {
    /* If you're wondering why this isn't in componentDidMount, it's because
     * kebabs are dropdowns. A list of 200 pods would mean 200 global event
     * listeners. This is bad for performance. - ggreer
     */
    window.removeEventListener('click', this.listener);
    window.addEventListener('click', this.listener);
    this.setState({active: true});
  }

  hide(e) {
    e && e.stopPropagation();
    window.removeEventListener('click', this.listener);
    this.setState({active: false});
  }
}

const Caret = () => <span className="caret" />;

class DropDownRow extends React.PureComponent {
  render() {
    const {itemKey, content, onclick, onBookmark, onUnBookmark, className, selected, hover, canFavorite, onFavorite, favoriteKey} = this.props;
    let prefix;
    if (onUnBookmark) {
      prefix = <a href="#" className={classNames('bookmarker', {hover, focus: selected})} onClick={e => onUnBookmark(e, itemKey)}><i aria-hidden className="fa fa-minus-circle" /></a>;
    }
    if (onBookmark) {
      prefix = <a href="#" className={classNames('bookmarker', {hover, focus: selected})} onClick={e => onBookmark(e, itemKey, content)}><i aria-hidden className="fa fa-plus-circle" /></a>;
    }

    let suffix;
    if (onUnBookmark && canFavorite) {
      const isFavorite = favoriteKey === itemKey;
      suffix = <a href="#" className={classNames('bookmarker', {hover, focus: selected})} onClick={e => onFavorite(e, (isFavorite ? undefined : itemKey))}><i aria-hidden className={classNames('fa fa-star', {'favorite': isFavorite})} /></a>;
    }

    return <li role="option" className={classNames(className)} key={itemKey}>
      {prefix}
      <a href="#" ref={this.link} id={`${itemKey}-link`} className={classNames({'next-to-bookmark': !!prefix, hover, focus: selected})} onClick={e => onclick(itemKey, e)}>{content}</a>
      {suffix}
    </li>;
  }
}

/** @augments {React.Component<any>} */
export class Dropdown extends DropdownMixin {
  constructor(props) {
    super(props);
    this.onUnBookmark = (...args) => this.onUnBookmark_(...args);
    this.onBookmark = (...args) => this.onBookmark_(...args);
    this.onFavorite = (...args) => this.onFavorite_(...args);
    this.onClick = (...args) => this.onClick_(...args);

    let bookmarks = props.defaultBookmarks || {};
    let favoriteKey;
    if (props.storageKey) {
      try {
        const parsedBookmarks = JSON.parse(localStorage.getItem(this.bookmarkStorageKey));
        if (_.isPlainObject(parsedBookmarks)) {
          bookmarks = parsedBookmarks;
        }
        const parsedFavorite = localStorage.getItem(props.storageKey);
        if (props.canFavorite && _.isString(parsedFavorite)) {
          favoriteKey = parsedFavorite;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`could not load bookmarks for ${props.storageKey}: ${e}`);
      }
    }
    this.state.favoriteKey = favoriteKey;
    this.state.bookmarks = bookmarks;

    this.state.items = Object.assign({}, bookmarks, props.items);

    this.state.title = props.noSelection
      ? props.title
      : _.get(props.items, props.selectedKey, <span className="btn-dropdown__item--placeholder">{props.title}</span>);

    this.onKeyDown = e => this.onKeyDown_(e);
    this.changeTextFilter = e => this.applyTextFilter_(e.target.value, this.props.items);
    const { shortCut } = this.props;
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

  get bookmarkStorageKey() {
    return `${this.props.storageKey}-bookmarks`;
  }

  componentDidMount() {
    if (this.props.shortCut) {
      window.addEventListener('keydown', this.globalKeyDown);
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener('keydown', this.globalKeyDown);
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);
    const props = this.props;

    if (_.isEqual(nextProps.items, props.items) && nextProps.title === props.title) {
      return;
    }
    const title = nextProps.title || props.title;
    this.setState({title});

    this.applyTextFilter_(this.state.autocompleteText, nextProps.items);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.active && this.state.active && this.input) {
      // Clear any previous filter when reopening the dropdown.
      this.applyTextFilter_('', this.props.items);
    }
  }

  applyTextFilter_(autocompleteText, items) {
    const { autocompleteFilter } = this.props;
    items = Object.assign({}, this.state.bookmarks, items);
    if (autocompleteFilter && !_.isEmpty(autocompleteText)) {
      items = _.pickBy(items, (item, key) => autocompleteFilter(autocompleteText, item, key));
    }
    this.setState({autocompleteText, items});
  }

  onKeyDown_(e) {
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
      if (this.state.active && items[keyboardHoverKey]) {
        this.onClick(keyboardHoverKey, e);
      }
      return;
    }

    const keys = _.keys(items);

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

  onFavorite_(e, favoriteKey) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({favoriteKey});
    if (favoriteKey) {
      localStorage.setItem(this.props.storageKey, favoriteKey);
    } else {
      // do not set `undefined` as a value in localstorage
      localStorage.removeItem(this.props.storageKey, favoriteKey);
    }
  }

  onBookmark_(e, key, value) {
    e.preventDefault();
    e.stopPropagation();

    const bookmarks = Object.assign({}, this.state.bookmarks);
    bookmarks[key] = value;
    this.setState({bookmarks});
    localStorage.setItem(this.bookmarkStorageKey, JSON.stringify(bookmarks));
  }

  onUnBookmark_(e, key) {
    e.preventDefault();
    e.stopPropagation();

    const bookmarks = Object.assign({}, this.state.bookmarks);
    delete bookmarks[key];
    this.setState({bookmarks});
    localStorage.setItem(this.bookmarkStorageKey, JSON.stringify(bookmarks));
  }

  render() {
    const {active, autocompleteText, selectedKey, items, title, bookmarks, keyboardHoverKey, favoriteKey} = this.state;
    const {autocompleteFilter, autocompletePlaceholder, className, buttonClassName, menuClassName, storageKey, canFavorite, dropDownClassName, titlePrefix, describedBy} = this.props;

    const spacerBefore = this.props.spacerBefore || new Set();
    const headerBefore = this.props.headerBefore || {};
    const rows = [];
    const bookMarkRows = [];

    const addItem = (key, content) => {
      const selected = (key === selectedKey) && !this.props.noSelection;
      const hover = key === keyboardHoverKey;
      const klass = classNames({'active': selected});
      if (storageKey && bookmarks && bookmarks[key]) {
        bookMarkRows.push(<DropDownRow className={klass} key={key} itemKey={key} content={content} onUnBookmark={this.onUnBookmark} onclick={this.onClick} selected={selected} hover={hover} canFavorite={canFavorite} onFavorite={this.onFavorite} favoriteKey={favoriteKey} />);
        return;
      }
      if (spacerBefore.has(key)) {
        rows.push(<li key={`${key}-spacer`}><div className="dropdown-menu__divider" /></li>);
      }

      if (_.has(headerBefore, key)) {
        rows.push(<li key={`${key}-header`}><div className="dropdown-menu__header" >{headerBefore[key]}</div></li>);
      }
      rows.push(<DropDownRow className={klass} key={key} itemKey={key} content={content} onBookmark={storageKey && this.onBookmark} onclick={this.onClick} selected={selected} hover={hover} />);
    };

    _.each(items, (v, k) => addItem(k, v));

    return <div className={classNames(className)} ref={this.dropdownElement} style={this.props.style}>
      <div className={classNames('dropdown', dropDownClassName)}>
        <button aria-haspopup="true" onClick={this.toggle} onKeyDown={this.onKeyDown} type="button" className={classNames('btn', 'btn-dropdown', 'dropdown-toggle', buttonClassName ? buttonClassName : 'btn-default')} id={this.props.id} aria-describedby={describedBy} >
          <div className="btn-dropdown__content-wrap">
            <span className="btn-dropdown__item">
              {titlePrefix && <span className="btn-link__titlePrefix">{titlePrefix}: </span>}
              {title}
            </span>
            <Caret />
          </div>
        </button>
        {
          active && <ul role="listbox" ref={this.dropdownList} className={classNames('dropdown-menu', 'dropdown-menu--block', menuClassName)}>
            {
              autocompleteFilter && <div className="dropdown-menu__filter">
                <input
                  autoFocus
                  type="text"
                  ref={input => this.input = input}
                  onChange={this.changeTextFilter}
                  placeholder={autocompletePlaceholder}
                  value={autocompleteText || ''}
                  autoCapitalize="none"
                  onKeyDown={this.onKeyDown}
                  className="form-control dropdown--text-filter"
                  onClick={e => e.stopPropagation()} />
              </div>
            }
            { bookMarkRows }
            {_.size(bookMarkRows) ? <li className="co-namespace-selector__divider"><div className="dropdown-menu__divider" /></li> : null}
            {rows}
          </ul>
        }
      </div>
    </div>;
  }
}

Dropdown.propTypes = {
  autocompleteFilter: PropTypes.func,
  autocompletePlaceholder: PropTypes.string,
  canFavorite: PropTypes.bool,
  className: PropTypes.string,
  defaultBookmarks: PropTypes.objectOf(PropTypes.string),
  dropDownClassName: PropTypes.string,
  enableBookmarks: PropTypes.bool,
  headerBefore: PropTypes.objectOf(PropTypes.string),
  items: PropTypes.object.isRequired,
  menuClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  noSelection: PropTypes.bool,
  storageKey: PropTypes.string,
  spacerBefore: PropTypes.instanceOf(Set),
  textFilter: PropTypes.string,
  title: PropTypes.node,
};

class ActionsMenuDropdown extends DropdownMixin {
  render() {
    const {actions, title = undefined, buttonClassName = 'btn-default'} = this.props;
    const onClick = (event, option) => {
      event.preventDefault();

      if (option.callback) {
        option.callback();
      }

      if (option.href) {
        history.push(option.href);
      }

      this.hide();
    };
    return <div ref={this.dropdownElement} className="co-actions-menu dropdown">
      <button type="button" aria-haspopup="true" className={classNames('btn btn-dropdown btn-dropdown-toggle', buttonClassName)} onClick={this.toggle} data-test-id="actions-menu-button">
        <div className="btn-dropdown__content-wrap">
          <span className="btn-dropdown__item">
            {title || 'Actions'}
          </span>
          <Caret />
        </div>
      </button>
      {this.state.active && <KebabItems options={actions} onClick={onClick} isActionDropdown />}
    </div>;
  }
}

const ActionsMenu_ = ({actions, impersonate, title = undefined, buttonClassName = undefined}) => {
  const [isVisible, setVisible] = React.useState(false);

  // Check if any actions are visible when actions have access reviews.
  React.useEffect(() => {
    if (!actions.length) {
      setVisible(false);
      return;
    }

    const promises = actions.reduce((acc, action) => {
      if (action.accessReview) {
        acc.push(checkAccess(action.accessReview));
      }
      return acc;
    }, []);

    if (_.isEmpty(promises)) {
      setVisible(true);
      return;
    }

    Promise.all(promises)
      .then((results) => setVisible(_.some(results, 'status.allowed')))
      .catch(() => setVisible(true));
  }, [actions, impersonate]);

  return isVisible
    ? <ActionsMenuDropdown actions={actions} title={title} buttonClassName={buttonClassName} />
    : null;
};
export const ActionsMenu = connect(impersonateStateToProps)(ActionsMenu_);

ActionsMenu.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      href: PropTypes.string,
      callback: PropTypes.func,
      accessReview: PropTypes.object,
    })).isRequired,
  title: PropTypes.node,
  buttonClassName: PropTypes.string,
};

const containerLabel = (container) =>
  <ResourceName name={container ? container.name : ''} kind="Container" />;

export class ContainerDropdown extends React.PureComponent {

  getSpacer(container) {
    const spacerBefore = new Set();
    return container ? spacerBefore.add(container.name) : spacerBefore;
  }

  getHeaders(container, initContainer) {
    return initContainer ? {
      [container.name]: 'Containers',
      [initContainer.name]: 'Init Containers',
    } : {};
  }

  render() {
    const {currentKey, containers, initContainers, onChange} = this.props;
    if (_.isEmpty(containers) && _.isEmpty(initContainers)) {
      return null;
    }
    const firstInitContainer = _.find(initContainers, {order: 0});
    const firstContainer = _.find(containers, {order: 0});
    const spacerBefore = this.getSpacer(firstInitContainer);
    const headerBefore = this.getHeaders(firstContainer, firstInitContainer);
    const dropdownItems = _.mapValues(_.merge(containers, initContainers), containerLabel);
    const title = _.get(dropdownItems, currentKey) || containerLabel(firstContainer);
    return <Dropdown
      className="btn-group"
      menuClassName="dropdown-menu--text-wrap"
      headerBefore={headerBefore}
      items={dropdownItems}
      spacerBefore={spacerBefore}
      title={title}
      onChange={onChange}
      selectedKey={currentKey} />;
  }
}

ContainerDropdown.propTypes = {
  containers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  currentKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initContainers: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

ContainerDropdown.defaultProps = {
  currentKey: '',
  initContainers: {},
};
