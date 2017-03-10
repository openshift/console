import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import {linkEncode} from '../../module/k8s/labels';

const Label = ({kind, name, value, expand}) => {
  const labelObj = {[name]: value};
  const query = linkEncode(labelObj);
  const href = `search?kind=${kind}&q=${query}`;
  const klass = classNames('co-m-label', {'co-m-label--expand': expand});

  return (
    <Link className={`co-text-${kind}`} to={href}>
      <div className={klass}>
        <span className="co-m-label__key">{name}</span>
        <span className="co-m-label__eq">=</span>
        <span className="co-m-label__value">{value}</span>
      </div>
    </Link>
  );
};

export const LabelList = ({labels, kind, expand = true}) => {
  let list = _.map(labels, (label, key) => <Label key={key} kind={kind} name={key} value={label} expand={expand} />);

  if (_.isEmpty(list)) {
    list = <div className="text-muted">No labels</div>;
  }

  return <div className="co-m-label-list">{list}</div>;
};
