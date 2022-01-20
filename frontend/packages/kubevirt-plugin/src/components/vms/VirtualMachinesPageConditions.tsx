import * as React from 'react';
import { Popover, PopoverPosition } from '@patternfly/react-core';
import * as classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { VMIKind, VMKind } from '../../types';

const Label: React.FC<LableProps> = ({ k, v, m }) => {
  const popover = (bodyContent, children) => (
    <Popover position={PopoverPosition.right} bodyContent={bodyContent}>
      {children}
    </Popover>
  );
  const label = (
    <div
      className={classnames('co-m-label co-m-label--expand', {
        'kv-conditions-list--popover': !!m,
      })}
      key={k}
    >
      <span className="co-m-label__key">{k}</span>
      <span className="co-m-label__eq">: </span>
      <span className="co-m-label__value">{v}</span>
    </div>
  );

  return m ? popover(<p>{m}</p>, <span>{label}</span>) : label;
};

const VirtualMachinesPageConditions: React.FC<VirtualMachinesPageConditionsProps> = ({
  kind,
  obj,
}) => {
  const { t } = useTranslation();
  const conditions = obj.status?.conditions || [];

  return !conditions.length ? (
    <div className="text-muted">{t('kubevirt-plugin~No conditions')}</div>
  ) : (
    <div className={`co-text-${kind}`}>
      {conditions.map((c) => (
        <Label key={c.type} k={c.type} v={c.status} m={c?.message} />
      ))}
    </div>
  );
};

type LableProps = { k: string; v: string; m?: string };

type VirtualMachinesPageConditionsProps = {
  kind: any;
  obj: VMKind | VMIKind;
};

export { VirtualMachinesPageConditions };
