import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

const Label = ({kind, name, value, expand}) => {
  const href = `search?kind=${kind}&q=${value ? encodeURIComponent(`${name}=${value}`) : name}`;
  const klass = classNames('co-m-label', {'co-m-label--expand': expand});

  return (
    <Link className={`co-text-${kind}`} to={href}>
      <div className={klass}>
        <span className="co-m-label__key">{name}</span>
        {value && <span className="co-m-label__eq">=</span>}
        {value && <span className="co-m-label__value">{value}</span>}
      </div>
    </Link>
  );
};

export class LabelList extends React.PureComponent {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }

  render () {
    const {labels, kind, expand = true} = this.props;
    let list = _.map(labels, (label, key) => <Label key={key} kind={kind} name={key} value={label} expand={expand} />);

    if (_.isEmpty(list)) {
      list = <div className="text-muted">No labels</div>;
    }

    return <div className="co-m-label-list">{list}</div>;
  }
}
