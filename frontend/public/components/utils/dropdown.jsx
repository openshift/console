import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation, withTranslation } from 'react-i18next';
import { CaretDownIcon, MinusCircleIcon, PlusCircleIcon, StarIcon } from '@patternfly/react-icons';
import { impersonateStateToProps, useSafetyFirst } from '@console/dynamic-plugin-sdk';
import { useUserSettingsCompatibility } from '@console/shared';

import { checkAccess } from './rbac';
import { history } from './router';
import { KebabItems } from './kebab';
import { ResourceName } from './resource-icon';

class DropdownMixin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.listener = this._onWindowClick.bind(this);
    this.state = { active: !!props.active, selectedKey: props.selectedKey };
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

    if (event.target === current || (current && current.contains(event.target))) {
      return;
    }

    this.hide(event);
  }

  UNSAFE_componentWillReceiveProps({ selectedKey, items }) {
    if (selectedKey !== this.props.selectedKey) {
      this.setState({ selectedKey, title: items[selectedKey] });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.listener);
  }

  onClick_(selectedKey, e) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();

    const { items, actionItems, onChange, noSelection, title } = this.props;

    if (onChange) {
      onChange(selectedKey, e);
    }

    const newTitle = items[selectedKey];

    if (!actionItems || !_.some(actionItems, { actionKey: selectedKey })) {
      this.setState({
        selectedKey,
        title: noSelection ? title : newTitle,
      });
    }

    this.hide();
  }

  toggle(e) {
    e.preventDefault();

    if (this.props.disabled) {
      return;
    }

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
    this.setState({ active: true });
  }

  hide(e) {
    e && e.stopPropagation();
    window.removeEventListener('click', this.listener);
    this.setState({ active: false });
  }
}

class DropDownRowWithTranslation extends React.PureComponent {
  render() {
    const {
      itemKey,
      content,
      onclick,
      className,
      selected,
      hover,
      autocompleteFilter,
      isBookmarked,
      onBookmark,
      favoriteKey,
      canFavorite,
      onFavorite,
      t,
    } = this.props;

    let prefix;
    const contentString = _.isString(content) ? content : '';

    if (!autocompleteFilter && !onBookmark) {
      //use pf4 markup if not using the autocomplete dropdown
      return (
        <li key={itemKey}>
          <button
            className="pf-c-dropdown__menu-item"
            id={`${itemKey}-link`}
            data-test-id="dropdown-menu"
            data-test-dropdown-menu={itemKey}
            onClick={(e) => onclick(itemKey, e)}
          >
            {content}
          </button>
        </li>
      );
    }
    if (onBookmark) {
      prefix = (
        <a
          href="#"
          className={classNames('bookmarker', { hover, focus: selected })}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBookmark(itemKey, !isBookmarked);
          }}
          aria-label={
            isBookmarked
              ? t('public~Remove bookmark {{content}}', { content: contentString })
              : t('public~Add bookmark {{content}}', { content: contentString })
          }
        >
          {isBookmarked ? <MinusCircleIcon /> : <PlusCircleIcon />}
        </a>
      );
    }

    let suffix;
    if (isBookmarked && canFavorite) {
      const isFavorite = favoriteKey === itemKey;
      suffix = (
        <a
          href="#"
          className={classNames('bookmarker', { hover, focus: selected })}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavorite(isFavorite ? null : itemKey);
          }}
          aria-label={
            isFavorite
              ? t('public~Remove favorite {{content}}', { content: contentString })
              : t('public~Add favorite {{content}}', { content: contentString })
          }
        >
          <StarIcon className={classNames({ favorite: isFavorite })} />
        </a>
      );
    }

    return (
      <li role="option" className={classNames(className)} key={itemKey}>
        {prefix}
        <a
          href="#"
          ref={this.link}
          id={`${itemKey}-link`}
          data-test="dropdown-menu-item-link"
          className={classNames('pf-c-dropdown__menu-item', {
            'next-to-bookmark': !!prefix,
            hover,
            focus: selected,
          })}
          onClick={(e) => onclick(itemKey, e)}
        >
          {content}
        </a>
        {suffix}
      </li>
    );
  }
}

const DropDownRow = withTranslation()(DropDownRowWithTranslation);

class Dropdown_ extends DropdownMixin {
  constructor(props) {
    super(props);
    this.onClick = (...args) => this.onClick_(...args);

    this.state.items = props.items;
    this.state.title = props.noSelection
      ? props.title
      : _.get(props.items, props.selectedKey, props.title);

    this.onKeyDown = (e) => this.onKeyDown_(e);
    this.changeTextFilter = (e) => this.applyTextFilter_(e.target.value, this.props.items);
    const { shortCut } = this.props;

    this.globalKeyDown = (e) => {
      if (e.key === 'Escape' && this.state.active) {
        this.hide(e);
        return;
      }

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

  componentDidMount() {
    if (this.props.shortCut) {
      window.addEventListener('keydown', this.globalKeyDown);
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener('keydown', this.globalKeyDown);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    super.UNSAFE_componentWillReceiveProps(nextProps);
    const props = this.props;

    if (_.isEqual(nextProps.items, props.items) && nextProps.title === props.title) {
      return;
    }
    const title = nextProps.title || props.title;
    this.setState({ title });

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
    if (autocompleteFilter && !_.isEmpty(autocompleteText)) {
      items = _.pickBy(items, (item, key) => autocompleteFilter(autocompleteText, item, key));
    }
    this.setState({ autocompleteText, items });
  }

  onKeyDown_(e) {
    const { key } = e;

    if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter') {
      return;
    }

    const { keyboardHoverKey } = this.state;
    const { items } = this.props;

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
    if (index >= keys.length) {
      index = 0;
    }
    if (index < 0) {
      index = keys.length - 1;
    }

    const newKey = keys[index];
    this.setState({ keyboardHoverKey: newKey });
    e.stopPropagation();
  }

  renderActionItem() {
    const { actionItems } = this.props;
    if (actionItems) {
      const { selectedKey, keyboardHoverKey, noSelection } = this.props;
      return (
        <>
          {actionItems.map((ai) => (
            <DropDownRow
              className={classNames({ active: ai.actionKey === selectedKey && !noSelection })}
              key={`${ai.actionKey}-${ai.actionTitle}`}
              itemKey={ai.actionKey}
              content={ai.actionTitle}
              onclick={this.onClick}
              selected={ai.actionKey === selectedKey && !noSelection}
              hover={ai.actionKey === keyboardHoverKey}
            />
          ))}
          <li className="co-namespace-selector__divider">
            <div className="dropdown-menu__divider" />
          </li>
        </>
      );
    }
    return null;
  }

  render() {
    const { active, autocompleteText, selectedKey, items, title, keyboardHoverKey } = this.state;
    const {
      ariaLabel,
      autocompleteFilter,
      autocompletePlaceholder,
      className,
      buttonClassName,
      menuClassName,
      storageKey,
      dropDownClassName,
      titlePrefix,
      describedBy,
      disabled,
      bookmarks,
      onBookmark,
      favoriteKey,
      canFavorite,
      onFavorite,
    } = this.props;
    const spacerBefore = this.props.spacerBefore || new Set();
    const headerBefore = this.props.headerBefore || {};
    const rows = [];
    const bookMarkRows = [];

    const addItem = (key, content) => {
      const selected = key === selectedKey && !this.props.noSelection;
      const hover = key === keyboardHoverKey;
      const klass = classNames({ active: selected });
      if (storageKey && bookmarks && bookmarks[key]) {
        bookMarkRows.push(
          <DropDownRow
            className={klass}
            key={key}
            itemKey={key}
            content={content}
            onclick={this.onClick}
            selected={selected}
            hover={hover}
            isBookmarked
            onBookmark={onBookmark}
            favoriteKey={favoriteKey}
            canFavorite={canFavorite}
            onFavorite={onFavorite}
          />,
        );
        return;
      }
      if (spacerBefore.has(key)) {
        rows.push(
          <li key={`${key}-spacer`}>
            <div className="dropdown-menu__divider" />
          </li>,
        );
      }

      if (_.has(headerBefore, key)) {
        rows.push(
          <li key={`${key}-header`}>
            <div className="dropdown-menu__header">{headerBefore[key]}</div>
          </li>,
        );
      }
      rows.push(
        <DropDownRow
          className={klass}
          key={key}
          itemKey={key}
          content={content}
          onBookmark={storageKey && onBookmark}
          onclick={this.onClick}
          selected={selected}
          hover={hover}
          autocompleteFilter={autocompleteFilter}
        />,
      );
    };

    _.each(items, (v, k) => addItem(k, v));
    //render PF4 dropdown markup if this is not the autocomplete filter
    if (autocompleteFilter) {
      return (
        <div className={className} ref={this.dropdownElement} style={this.props.style}>
          <div
            className={classNames(
              'pf-c-dropdown',
              { 'pf-m-expanded': this.state.active },
              dropDownClassName,
            )}
          >
            <button
              aria-label={ariaLabel}
              aria-haspopup="true"
              onClick={this.toggle}
              onKeyDown={this.onKeyDown}
              type="button"
              className={classNames('pf-c-dropdown__toggle', buttonClassName)}
              id={this.props.id}
              aria-describedby={describedBy}
              disabled={disabled}
              data-test={this.props.dataTest}
            >
              <div className="pf-c-dropdown__content-wrap">
                <span className="pf-c-dropdown__toggle-text">
                  {titlePrefix && `${titlePrefix}: `}
                  {title}
                </span>
                <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
              </div>
            </button>
            {active && (
              <ul
                role="listbox"
                ref={this.dropdownList}
                className={classNames(
                  'dropdown-menu__autocomplete-filter',
                  'pf-c-dropdown__menu',
                  menuClassName,
                )}
              >
                {autocompleteFilter && (
                  <div className="dropdown-menu__filter">
                    <input
                      autoFocus
                      type="text"
                      ref={(input) => (this.input = input)}
                      onChange={this.changeTextFilter}
                      placeholder={autocompletePlaceholder}
                      value={autocompleteText || ''}
                      autoCapitalize="none"
                      onKeyDown={this.onKeyDown}
                      className="pf-c-form-control"
                      onClick={(e) => e.stopPropagation()}
                      data-test-id="dropdown-text-filter"
                    />
                  </div>
                )}
                {this.renderActionItem()}
                {bookMarkRows}
                {_.size(bookMarkRows) ? (
                  <li className="co-namespace-selector__divider">
                    <div className="dropdown-menu__divider" />
                  </li>
                ) : null}
                {rows}
              </ul>
            )}
          </div>
        </div>
      );
    }

    //pf4 markup
    return (
      <div className={className} ref={this.dropdownElement} style={this.props.style}>
        <div
          className={classNames(
            { 'pf-c-dropdown': true, 'pf-m-expanded': this.state.active },
            dropDownClassName,
          )}
        >
          <button
            aria-label={ariaLabel}
            aria-haspopup="true"
            aria-expanded={this.state.active}
            className={classNames('pf-c-dropdown__toggle', buttonClassName)}
            data-test-id="dropdown-button"
            onClick={this.toggle}
            onKeyDown={this.onKeyDown}
            type="button"
            id={this.props.id}
            data-test={this.props.dataTest}
            aria-describedby={describedBy}
            disabled={disabled}
          >
            <span className="pf-c-dropdown__toggle-text">
              {titlePrefix && `${titlePrefix}: `}
              {title}
            </span>
            <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
          </button>
          {active && (
            <ul
              ref={this.dropdownList}
              className={classNames('pf-c-dropdown__menu', menuClassName)}
            >
              {rows}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export const Dropdown = (props) => {
  const { userSettingsPrefix, storageKey } = props;

  // Should be undefined so that we don't save undefined-xxx.
  const favoriteUserSettingsKey = userSettingsPrefix ? `${userSettingsPrefix}.favorite` : undefined;
  const favoriteStorageKey = storageKey ? storageKey : undefined;
  const bookmarkUserSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.bookmarks`
    : undefined;
  const bookmarkStorageKey = storageKey ? `${storageKey}-bookmarks` : undefined;

  const [favoriteKey, setFavoriteKey] = useUserSettingsCompatibility(
    favoriteUserSettingsKey,
    favoriteStorageKey,
    undefined,
    true,
  );
  const [bookmarks, setBookmarks] = useUserSettingsCompatibility(
    bookmarkUserSettingsKey,
    bookmarkStorageKey,
    undefined,
    true,
  );

  const onBookmark = React.useCallback(
    (key, active) => {
      setBookmarks((oldBookmarks) => ({ ...oldBookmarks, [key]: active ? true : undefined }));
    },
    [setBookmarks],
  );

  return (
    <Dropdown_
      {...props}
      bookmarks={bookmarks}
      onBookmark={onBookmark}
      favoriteKey={favoriteKey}
      onFavorite={setFavoriteKey}
    />
  );
};

Dropdown.displayName = 'Dropdown';

Dropdown.propTypes = {
  actionItems: PropTypes.arrayOf(
    PropTypes.shape({
      actionKey: PropTypes.string,
      actionTitle: PropTypes.string,
    }),
  ),
  autocompleteFilter: PropTypes.func,
  autocompletePlaceholder: PropTypes.string,
  canFavorite: PropTypes.bool,
  className: PropTypes.string,
  dropDownClassName: PropTypes.string,
  enableBookmarks: PropTypes.bool,
  headerBefore: PropTypes.objectOf(PropTypes.string),
  items: PropTypes.object.isRequired,
  menuClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  noSelection: PropTypes.bool,
  userSettingsPrefix: PropTypes.string,
  storageKey: PropTypes.string,
  spacerBefore: PropTypes.instanceOf(Set),
  textFilter: PropTypes.string,
  title: PropTypes.node,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onChange: PropTypes.func,
  selectedKey: PropTypes.string,
  titlePrefix: PropTypes.string,
  ariaLabel: PropTypes.string,
  name: PropTypes.string,
  autoSelect: PropTypes.bool,
  describedBy: PropTypes.string,
  required: PropTypes.bool,
  dataTest: PropTypes.string,
};

class ActionsMenuDropdown_ extends DropdownMixin {
  render() {
    const { actions, title = undefined, t } = this.props;
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
    return (
      <div
        ref={this.dropdownElement}
        className={classNames({
          'co-actions-menu pf-c-dropdown': true,
          'pf-m-expanded': this.state.active,
        })}
      >
        <button
          type="button"
          aria-haspopup="true"
          aria-label={t('public~Actions')}
          aria-expanded={this.state.active}
          className="pf-c-dropdown__toggle"
          onClick={this.toggle}
          data-test-id="actions-menu-button"
        >
          <span className="pf-c-dropdown__toggle-text">{title || t('public~Actions')}</span>
          <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
        </button>
        {this.state.active && <KebabItems options={actions} onClick={onClick} />}
      </div>
    );
  }
}

const ActionsMenuDropdown = withTranslation()(ActionsMenuDropdown_);

const ActionsMenu_ = ({ actions, impersonate, title = undefined }) => {
  const [isVisible, setVisible] = useSafetyFirst(false);

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

    // Only need to resolve if all actions require access review
    if (promises.length !== actions.length) {
      setVisible(true);
      return;
    }
    Promise.all(promises)
      .then((results) => setVisible(_.some(results, 'status.allowed')))
      .catch(() => setVisible(true));
  }, [actions, impersonate, setVisible]);
  return isVisible ? <ActionsMenuDropdown actions={actions} title={title} /> : null;
};

export const ActionsMenu = connect(impersonateStateToProps)(ActionsMenu_);

ActionsMenu.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      labelKey: PropTypes.string,
      href: PropTypes.string,
      callback: PropTypes.func,
      accessReview: PropTypes.object,
    }),
  ).isRequired,
  title: PropTypes.node,
};

const containerLabel = (container) => (
  <ResourceName name={container ? container.name : ''} kind="Container" />
);

export const ContainerDropdown = (props) => {
  const { t } = useTranslation();

  const getSpacer = (container) => {
    const spacerBefore = new Set();
    return container ? spacerBefore.add(container.name) : spacerBefore;
  };

  const getHeaders = (container, initContainer) => {
    return initContainer
      ? {
          [container.name]: t('public~Containers'),
          [initContainer.name]: t('public~Init containers'),
        }
      : {};
  };

  const { currentKey, containers, initContainers, onChange } = props;
  if (_.isEmpty(containers) && _.isEmpty(initContainers)) {
    return null;
  }
  const firstInitContainer = _.find(initContainers, { order: 0 });
  const firstContainer = _.find(containers, { order: 0 });
  const spacerBefore = getSpacer(firstInitContainer);
  const headerBefore = getHeaders(firstContainer, firstInitContainer);
  const dropdownItems = _.mapValues(_.merge(containers, initContainers), containerLabel);
  const title = _.get(dropdownItems, currentKey) || containerLabel(firstContainer);
  return (
    <Dropdown
      headerBefore={headerBefore}
      items={dropdownItems}
      spacerBefore={spacerBefore}
      title={title}
      onChange={onChange}
      selectedKey={currentKey}
      dataTest="container-dropdown"
    />
  );
};

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
