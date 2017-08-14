import * as React from 'react';
import * as classNames from'classnames';

const CheckBox = ({title, active, number, toggle}) => {
  const klass = classNames('row-filter--box clickable', {
    'row-filter--box__active': active, 'row-filter--box__empty': !number,
  });

  return <div onClick={toggle} className={klass}>
    <span className="row-filter--number-bubble">{number}</span> {title}
  </div>;
};

export class CheckBoxes extends React.Component {
  constructor (props) {
    super(props);
    this.state = {selected: []};
  }

  get storageKey () {
    return `row-filter--${this.props.type}`;
  }

  componentDidMount () {
    let selected;
    try {
      selected = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (ignored) {
      // ignore
    }

    if (_.isEmpty(selected) || !_.isArray(selected)) {
      selected = this.props.selected || [];
    }

    this.setState({selected}, () => this.applyFilter());
  }

  componentDidUpdate (prevProps) {
    if (!_.isEqual(this.props.items, prevProps.items)) {
      this.applyFilter();
    }
  }

  applyFilter () {
    const all = _.map(this.props.items, 'id');
    const recognized = _.intersection(this.state.selected, all);
    if (!_.isEmpty(recognized)) {
      this.props.applyFilter(this.props.type, {selected: new Set(recognized), all});
    }
  }

  toggle (id) {
    const selected = _.xor(this.state.selected, [id]);

    // Ensure something is always active
    if (!_.isEmpty(selected)) {
      try {
        const recognized = _.filter(selected, id => _.find(this.props.items, {id}));
        localStorage.setItem(this.storageKey, JSON.stringify(recognized));
      } catch (ignored) {
        // ignore
      }

      this.setState({selected}, () => this.applyFilter());
    }
  }

  render () {
    const checkboxes = _.map(this.props.items, ({id, title}) => {
      return <CheckBox
        key={id}
        title={title}
        number={this.props.numbers[id] || 0}
        active={_.includes(this.state.selected, id)}
        toggle={this.toggle.bind(this, id)}
      />;
    });

    return <div className="col-xs-12">
      <div className="row-filter">{checkboxes}</div>
    </div>;
  }
}
