import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { filterList } from '../actions/k8s';
import { getQueryArgument, setQueryArgument } from './utils';

export const CheckBox = ({title, active, number, toggle}) => {
  const klass = classNames('row-filter__box', {
    'row-filter__box--active': active, 'row-filter__box--empty': !number,
  });

  return <a href="#" onClick={toggle} className={klass}>
    <span className="row-filter__number-bubble">{number}</span>{title}
  </a>;
};

export const CheckBoxControls = ({allSelected, itemCount, selectedCount, onSelectAll, children}) => (
  <div className="row">
    <div className="col-xs-12">
      <div className="row-filter">
        {children}
        <div className="co-m-row-filter__controls">
          <button className="btn btn-link co-m-row-filter__selector" disabled={allSelected} type="button" onClick={onSelectAll}>Select All Filters</button>
          <span className="co-m-row-filter__items">
            {itemCount === selectedCount ? itemCount : <>{selectedCount} of {itemCount}</>} Item{itemCount !== 1 && 's'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const storagePrefix = 'rowFilter-';

class CheckBoxes_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selected: []};
    this.selectAll = this.selectAll.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  get storageKey() {
    return `${storagePrefix}${this.props.type}`;
  }

  componentDidMount() {
    let selected;
    try {
      selected = (getQueryArgument(this.storageKey)).split(',');
    } catch (ignored) {
      // ignore
    }

    if (_.isEmpty(selected) || !_.isArray(selected)) {
      selected = this.props.selected || [];
    }

    const allSelected = _.isEmpty(_.xor(selected, _.map(this.props.items, 'id')));

    this.setState({allSelected, selected}, () => this.applyFilter());
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.items, prevProps.items) || !_.isEqual(this.props.reduxIDs, prevProps.reduxIDs)) {
      this.applyFilter();
    }
  }

  applyFilter() {
    const all = _.map(this.props.items, 'id');
    const recognized = _.intersection(this.state.selected, all);
    if (!_.isEmpty(recognized)) {
      this.props.reduxIDs.forEach(id => this.props.filterList(id, this.props.type, {selected: new Set(recognized), all}));
    }
  }

  setQueryParameters(selected) {
    // Ensure something is always active
    if (!_.isEmpty(selected)) {
      try {
        const recognized = _.filter(selected, id => _.find(this.props.items, {id}));
        setQueryArgument(this.storageKey, recognized.join(','));
      } catch (ignored) {
        // ignore
      }
      const allSelected = _.isEmpty(_.xor(selected, _.map(this.props.items, 'id')));
      this.setState({allSelected, selected}, () => this.applyFilter());
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
    const {items, itemCount} = this.props;
    const {selected} = this.state;
    const allSelected = _.every(items, ({id}) => _.includes(selected, id));
    const selectedCount = _.reduce(selected, (count, id) => count + (this.props.numbers[id] || 0), 0);
    return (
      <CheckBoxControls
        allSelected={allSelected}
        itemCount={itemCount}
        selectedCount={selectedCount}
        onSelectAll={this.selectAll}
      >
        {_.map(items, ({id, title}) =>
          <CheckBox
            key={id}
            title={title}
            number={this.props.numbers[id] || 0}
            active={_.includes(selected, id)}
            toggle={event => this.toggle(event, id)}
          />
        )}
      </CheckBoxControls>
    );
  }
}

/** @type {React.SFC<{items: Array, itemCount: number, numbers: any, reduxIDs: Array, selected?: Array, type: string}>} */
export const CheckBoxes = connect(null, {filterList})(CheckBoxes_);
