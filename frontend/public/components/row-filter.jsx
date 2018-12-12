import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import k8sActions from '../module/k8s/k8s-actions';
import { getQueryArgument, pluralize, setQueryArgument } from './utils';

const CheckBox = ({title, active, number, toggle}) => {
  const klass = classNames('row-filter__box', {
    'row-filter__box--active': active, 'row-filter__box--empty': !number,
  });

  return <a href="#" onClick={toggle} className={klass}>
    <span className="row-filter__number-bubble">{number}</span>{title}
  </a>;
};

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

  countNumItems() {
    const selectedCheckboxCounts = _.map(this.state.selected, (id) => {
      return this.props.numbers[id] || 0;
    });
    const numSelectedItems = _.sum(selectedCheckboxCounts);
    const allSelected = _.isEmpty(_.xor(this.state.selected, _.map(this.props.items, 'id')));
    const totalItems = pluralize(this.props.itemCount, 'Item');
    return allSelected ? totalItems : `${numSelectedItems} of ${totalItems}`;
  }

  render() {
    const {allSelected} = this.state;
    const checkboxes = _.map(this.props.items, ({id, title}) => {
      return <CheckBox
        key={id}
        title={title}
        number={this.props.numbers[id] || 0}
        active={_.includes(this.state.selected, id)}
        toggle={event => this.toggle(event, id)}
      />;
    });
    const count = this.countNumItems();

    return <div className="col-xs-12">
      <div className="row-filter">
        {checkboxes}
        <div className="co-m-row-filter__controls">
          <button className="btn btn-link co-m-row-filter__selector" disabled={allSelected} type="button" onClick={this.selectAll}>Select All Filters</button>
          <span className="co-m-row-filter__items">{count}</span>
        </div>
      </div>
    </div>;
  }
}

/** @type {React.SFC<{items: Array, itemCount: number, numbers: any, reduxIDs: Array, selected?: Array, type: string}>} */
export const CheckBoxes = connect(null, {filterList: k8sActions.filterList})(CheckBoxes_);
