import React from 'react';
import classnames from 'classnames';

const CheckBox = ({name, active, number, toggle}) => {
  const klass = classnames('row-filter--box clickable', {
    'row-filter--box__active': active, 'row-filter--box__empty': !number,
  });

  return <div onClick={toggle} className={klass}>
    <span key={number} className="row-filter--number-bubble">{number}</span> {name}
  </div>;
};

export class CheckBoxes extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  get storageKey() {
    return `row-filter--${this.props.type}`;
  }

  componentDidMount() {
    let selected;

    try {
      selected = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (ignored) {
      // ignore
    }

    if (_.isEmpty(selected) || !_.isArray(selected)) {
      selected = this.props.selected || [];
    }
    const state = {};
    selected.forEach(i => state[i] = true);
    // replaceState no longer exists :(
    this.state = state;
    this.setState(this.state, () => this.applyFilter());
  }

  applyFilter () {
    const items = this.props.items || [];
    const selected = [];
    const filters = items.filter((item, i) => this.state[i] && selected.push(i)).map(i => i[1]);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(selected));
    } catch (ignored) {
      // ignore
    }

    this.props.applyFilter(this.props.type, {selected: new Set(filters), all: items});
  }

  toggle (i) {
    if (!this.props.items[i]) {
      return;
    }
    const nextState = Object.assign({}, this.state);
    nextState[i] = !nextState[i];
    // ensure something is always active
    const total = _.values(nextState).reduce((a, i) => a + i, 0);
    if (total < 1) {
      return;
    }
    this.setState({
      [i]: !this.state[i],
    }, () => this.applyFilter());
  }

  render () {
    const {items, numbers} = this.props;
    const active = this.state;

    const checkboxes = _.map(items, (item, i) => {
      const [name, filter] = item;
      const number = numbers[filter] || 0;
      const props = {
        name, number,
        key: i,
        active: active[i],
        toggle: this.toggle.bind(this, i),
      };
      return <CheckBox {...props} />;
    });

    return <div className="col-xs-12">
      <div className="row-filter">{checkboxes}</div>
    </div>;
  }
}
