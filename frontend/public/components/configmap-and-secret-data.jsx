import * as React from 'react';

const ConfigMapAndSecretData = ({data, decode}) => {
  decode = decode || (v => v);

  const dl = [];
  Object.keys(data || []).sort().forEach(k => {
    dl.push(<dt key={`${k}-k`}>{k}</dt>);
    dl.push(<dd key={`${k}-v`}><pre className="co-pre-wrap">{decode(data[k])}</pre></dd>);
  });

  return <dl>{dl}</dl>;
};

export default ConfigMapAndSecretData;
