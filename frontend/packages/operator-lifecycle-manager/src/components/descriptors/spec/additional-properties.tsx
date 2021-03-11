import * as React from 'react';
import * as _ from 'lodash';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

export const AdditionalPropertyFields: React.FC<AdditionalPropertyProps> = props => {
  let { data, onChange } = props;

  const obj = data;
  const [items, setItems] = React.useState(_.keys(obj).map(cur => ({ [cur]: obj[cur] })));

  const onAddProperty = () => {
    setItems(prev => items.concat({ '': '' }));
  };
  const onRemoveProperty = idx => {
    setItems(items.filter((cur, index) => idx !== index));
  };

  return (
    <>
      <Button id={`add-btn`} type="button" onClick={onAddProperty} variant="link">
        <PlusCircleIcon className="co-icon-space-r" />
        Add Property
      </Button>
      {items.length > 0 && (
        <div className="row" style={{ marginTop: '10px' }}>
          <div className="col-xs-4">Key</div>
          <div className="col-xs-4">Value</div>
        </div>
      )}
      {items.length > 0 && items.map((cur, idx) => <AdditionalPropertyItem key={idx} id={`property-${idx}`} index={idx} items={items} data={cur} onChange={onChange} onRemove={onRemoveProperty} />)}
    </>
  );
};

const AdditionalPropertyItem = props => {
  const { index, items, data, onChange, onRemove } = props;
  const [additionalKey, setKey] = React.useState(Object.keys(data)[0]);
  const [additionalValue, setValue] = React.useState(Object.values(data)[0] || ' ');
  React.useEffect(() => {
    setKey(Object.keys(data)[0]);
    setValue(Object.values(data)[0]);
  }, [data]);
  React.useEffect(() => {
    const result = {};
    items.forEach(cur => {
      result[Object.keys(cur)[0]] = Object.values(cur)[0];
    });
    return onChange(result);
  }, [additionalKey, additionalValue]);
  return (
    <div className="row co-m-form-row">
      <div className="col-xs-4">
        <input
          value={additionalKey}
          onChange={e => {
            const value = e.target.value;
            setKey(value);
            console.log(value);
            items.splice(index, 1, { [value]: additionalValue });
          }}
          id={additionalKey}
          name={additionalKey}
          type="text"
          className="pf-c-form-control"
          key={`key-${index}`}
        />
      </div>
      <div className="col-xs-4">
        <input
          value={additionalValue as string}
          onChange={e => {
            const value = e.target.value;
            setValue(value);
            console.log(value);
            items.splice(index, 1, { [additionalKey]: value });
          }}
          id={'value' + additionalValue}
          type="text"
          className="pf-c-form-control"
          key={`value-${index}`}
        />
      </div>
      <Button id={`btn-property-remove-${index}`} type="button" onClick={() => onRemove(index)} variant="link">
        <MinusCircleIcon className="co-icon-space-r" />
        Remove Property
      </Button>
    </div>
  );
};

type AdditionalPropertyProps = {
  data: any;
  path: string;
  onChange: any;
};
