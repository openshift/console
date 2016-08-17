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

const LabelList = ({labels, kind, expand}) => {
  let list = _.map(labels, (label, key) => <Label key={key} kind={kind} name={key} value={label} expand={!!expand} />);

  if (!list) {
    labels = <div className="text-muted" ng-if="isEmpty()">No labels</div>
  }

  return <div className="co-m-label-list">{list}</div>;
};

export default LabelList;
