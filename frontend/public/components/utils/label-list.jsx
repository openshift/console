import React from 'react';
import classNames from 'classnames';

import {angulars} from '../react-wrapper';

const Label = ({kind, name, value, expand}) => {
  const labelObj = {[name]: value};
  const query = angulars.k8s.labels.linkEncode(labelObj);
  const href = `search?kind=${kind}&q=${query}`;
  const klass = classNames('co-m-label', `co-m-label--${kind}`, {'co-m-label--expand': expand});

  return (
    <div className={klass}>
      <a className="co-m-label__link" href={href}>
        <span className="co-m-label__key">{name}</span>
        <span className="co-m-label__eq">=</span>
        <span className="co-m-label__value">{value}</span>
      </a>
    </div>
  );
};

export const LabelList = ({labels, kind, dontExpand}) => {
  let list = _.map(labels, (label, key) => <Label key={key} kind={kind} name={key} value={label} expand={!dontExpand} />);

  if (_.isEmpty(list)) {
    list = <div className="text-muted">No labels</div>
  }

  return <div className="co-m-label-list">{list}</div>;
};
