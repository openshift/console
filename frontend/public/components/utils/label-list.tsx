import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

const Label: React.SFC<LabelProps> = ({kind, name, value, expand}) => {
  const href = `/search?kind=${kind}&q=${value ? encodeURIComponent(`${name}=${value}`) : name}`;
  const klass = classNames('co-m-label', {'co-m-label--expand': expand});

  return (
    <Link className={`co-text-${kind.toLowerCase()}`} to={href} tabIndex={-1}>
      <div className={klass}>
        <span className="co-m-label__key">{name}</span>
        {value && <span className="co-m-label__eq">=</span>}
        {value && <span className="co-m-label__value">{value}</span>}
      </div>
    </Link>
  );
};

export class LabelList extends React.Component<LabelListProps> {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }

  render () {
    const {labels, kind, expand = true} = this.props;
    let list = _.map(labels, (label, key) => <Label key={key} kind={kind} name={key} value={label} expand={expand} />);

    if (_.isEmpty(list)) {
      list = [<div className="text-muted" key="0">No labels</div>];
    }

    return <div className="co-m-label-list">{list}</div>;
  }
}

/* eslint-disable no-undef */
export type LabelProps = {
  kind: string;
  name: string;
  value: string;
  expand: boolean;
};

export type LabelListProps = {
  labels: {[key: string]: string};
  kind: string;
  expand?: boolean;
};
/* eslint-enable no-undef */
