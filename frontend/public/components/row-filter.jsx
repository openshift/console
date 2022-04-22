import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { Button, Divider, Flex, FlexItem, ToggleGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { filterList } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import { getQueryArgument, setQueryArgument } from './utils';

export const CheckBox = ({ title, active, number, toggle }) => {
  const klass = classNames('pf-c-toggle-group__button', {
    'pf-m-selected co-row-filter__box--active': active,
    'pf-m-disabled': !number,
  });

  return (
    <div className="pf-c-toggle-group__item">
      <a href="#" onClick={toggle} className={klass}>
        <span
          className={classNames('co-row-filter__number-bubble', {
            'co-row-filter__number-bubble--active': active,
          })}
        >
          {number}
        </span>
        {title}
      </a>
    </div>
  );
};

export const CheckBoxControls = ({
  allSelected,
  itemCount,
  selectedCount,
  onSelectAll,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Flex className="co-row-filter" direction={{ default: 'column', md: 'row' }}>
      <ToggleGroup>{children}</ToggleGroup>
      <Divider className="pf-u-hidden-on-md" />
      <Flex flex={{ default: 'flex_1' }}>
        <FlexItem>
          <Button
            disabled={allSelected}
            type="button"
            onClick={onSelectAll}
            variant="link"
            isInline
          >
            {t('public~Select all filters')}
          </Button>
        </FlexItem>
        <FlexItem align={{ default: 'alignRight' }} className="co-row-filter__items">
          {itemCount === selectedCount ? (
            itemCount
          ) : (
            <>{t('public~{{selectedCount}} of {{itemCount}}', { selectedCount, itemCount })}</>
          )}{' '}
          {t('public~Item', { count: itemCount })}
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export const storagePrefix = 'rowFilter-';

class CheckBoxes_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selected: [] };
    this.selectAll = this.selectAll.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  get storageKey() {
    return `${storagePrefix}${this.props.type}`;
  }

  componentDidMount() {
    let selected;
    try {
      selected = getQueryArgument(this.storageKey).split(',');
    } catch (ignored) {
      // ignore
    }

    if (_.isEmpty(selected) || !_.isArray(selected)) {
      selected = this.props.selected || [];
    }

    const allSelected = _.isEmpty(_.xor(selected, _.map(this.props.items, 'id')));

    this.setState({ allSelected, selected }, () => this.applyFilter());
  }

  componentDidUpdate(prevProps) {
    if (
      !_.isEqual(this.props.items, prevProps.items) ||
      !_.isEqual(this.props.reduxIDs, prevProps.reduxIDs)
    ) {
      this.applyFilter();
    }
  }

  applyFilter() {
    const all = _.map(this.props.items, 'id');
    const recognized = _.intersection(this.state.selected, all);
    if (!_.isEmpty(recognized)) {
      this.props.onFilterChange?.(recognized);
      this.props.reduxIDs.forEach((id) =>
        this.props.filterList(id, this.props.type, { selected: [...new Set(recognized)], all }),
      );
    }
  }

  setQueryParameters(selected) {
    // Ensure something is always active
    if (!_.isEmpty(selected)) {
      try {
        const recognized = _.filter(selected, (id) => _.find(this.props.items, { id }));
        setQueryArgument(this.storageKey, recognized.join(','));
      } catch (ignored) {
        // ignore
      }
      const allSelected = _.isEmpty(_.xor(selected, _.map(this.props.items, 'id')));
      this.setState({ allSelected, selected }, () => this.applyFilter());
    }
  }

  toggle(event, itemId) {
    event.preventDefault();
    const selected = _.xor(this.state.selected, [itemId]);
    this.setQueryParameters(selected);
  }

  selectAll() {
    const selected = _.map(this.props.items, 'id');
    this.setQueryParameters(selected);
  }

  render() {
    const { items, itemCount } = this.props;
    const { selected } = this.state;
    const allSelected = _.every(items, ({ id }) => _.includes(selected, id));
    const selectedCount = _.reduce(
      selected,
      (count, id) => count + (this.props.numbers[id] || 0),
      0,
    );
    return (
      <CheckBoxControls
        allSelected={allSelected}
        itemCount={itemCount}
        selectedCount={selectedCount}
        onSelectAll={this.selectAll}
      >
        {_.map(items, ({ id, title }) => (
          <CheckBox
            key={id}
            title={title}
            number={this.props.numbers[id] || 0}
            active={_.includes(selected, id)}
            toggle={(event) => this.toggle(event, id)}
          />
        ))}
      </CheckBoxControls>
    );
  }
}

/** @type {React.SFC<{items: Array, itemCount: number, numbers: any, reduxIDs: Array, selected?: Array, type: string, onFilterChange?: (filter: string[]) => void}>} */
export const CheckBoxes = connect(null, { filterList })(CheckBoxes_);
