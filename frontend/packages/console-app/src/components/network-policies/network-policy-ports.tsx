import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { NetworkPolicyPort } from './network-policy-model';

export const NetworkPolicyPorts: React.FunctionComponent<NetworkPolicyPortsProps> = (props) => {
  const { direction, ports, onChange } = props;
  const { t } = useTranslation();
  const [allPorts, setAllPorts] = React.useState(ports.length === 0);
  React.useEffect(() => {
    setAllPorts(ports.length === 0);
  }, [ports.length]);

  const onSingleChange = (port: NetworkPolicyPort, index: number) => {
    onChange([...ports.slice(0, index), port, ...ports.slice(index + 1)]);
  };

  const onRemove = (index: number) => {
    onChange([...ports.slice(0, index), ...ports.slice(index + 1)]);
  };

  const dropdownItems = {
    all: <>{t('public~All ports')}</>,
    some: <>{t('public~Certain ports')}</>,
  };
  const selectedKey = allPorts ? 'all' : 'some';

  return (
    <>
      <div className="form-group co-create-networkpolicy__ports-type">
        <label>
          {direction === 'ingress' ? t('public~Allow traffic to') : t('public~Allow traffic from')}
        </label>
        <Dropdown
          dropDownClassName="dropdown--full-width"
          items={dropdownItems}
          onChange={(key) => {
            const isAllPorts = key === 'all';
            setAllPorts(isAllPorts);
            if (isAllPorts) {
              onChange([]);
            } else {
              onChange([{ key: _.uniqueId('port-'), port: '', protocol: 'TCP' }]);
            }
          }}
          selectedKey={selectedKey}
          title={dropdownItems[selectedKey]}
        />
      </div>
      {!allPorts && (
        <div className="form-group co-create-networkpolicy__ports-list">
          <label>{t('public~Ports')}</label>
          {ports.map((port, idx) => {
            const key = `port-${idx}`;
            return (
              <div className="pf-c-input-group" key={key}>
                <Dropdown
                  items={{
                    TCP: <>TCP</>,
                    UDP: <>UDP</>,
                    SCTP: <>SCTP</>,
                  }}
                  title={port.protocol}
                  name={`${key}-protocol`}
                  className="btn-group"
                  onChange={(protocol) => onSingleChange({ ...port, protocol }, idx)}
                />
                <input
                  className="pf-c-form-control"
                  onChange={(event) =>
                    onSingleChange({ ...port, port: event.currentTarget.value }, idx)
                  }
                  placeholder="443"
                  aria-describedby="ports-help"
                  name={`${key}-port`}
                  id={`${key}-port`}
                  value={port.port}
                />
                <Button
                  aria-label={t('public~Remove port')}
                  className="co-create-networkpolicy__remove-port"
                  onClick={() => onRemove(idx)}
                  type="button"
                  variant="plain"
                >
                  <MinusCircleIcon />
                </Button>
              </div>
            );
          })}
          <div className="co-toolbar__group co-toolbar__group--left co-create-networkpolicy__add-port">
            <Button
              className="pf-m-link--align-left"
              onClick={() => {
                onChange([...ports, { key: _.uniqueId('port-'), port: '', protocol: 'TCP' }]);
              }}
              type="button"
              variant="link"
            >
              <PlusCircleIcon className="co-icon-space-r" />
              {t('public~Add port')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

type NetworkPolicyPortsProps = {
  direction: 'ingress' | 'egress';
  ports: NetworkPolicyPort[];
  onChange: (ports: NetworkPolicyPort[]) => void;
};
