import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import k8sActions from '../module/k8s/k8s-actions';
import { getQueryArgument, setQueryArgument } from './utils';

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

    this.setState({selected}, () => this.applyFilter());
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

  toggle(event, itemId) {
    event.preventDefault();

    const selected = _.xor(this.state.selected, [itemId]);

    // Ensure something is always active
    if (!_.isEmpty(selected)) {
      try {
        const recognized = _.filter(selected, id => _.find(this.props.items, {id}));
        setQueryArgument(this.storageKey, recognized.join(','));
      } catch (ignored) {
        // ignore
      }

      this.setState({selected}, () => this.applyFilter());
    }
  }

  render() {
    const checkboxes = _.map(this.props.items, ({id, title}) => {
      return <CheckBox
        key={id}
        title={title}
        number={this.props.numbers[id] || 0}
        active={_.includes(this.state.selected, id)}
        toggle={event => this.toggle(event, id)}
      />;
    });

    return <div className="col-xs-12">
      <div className="row-filter">{checkboxes}</div>
    </div>;
  }
}

/** @type {React.SFC<{items: Array, numbers: any, reduxIDs: Array, selected?: Array, type: string}>} */
export const CheckBoxes = connect(null, {filterList: k8sActions.filterList})(CheckBoxes_);
