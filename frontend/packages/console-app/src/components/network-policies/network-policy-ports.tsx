import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { NetworkPolicyPort } from './network-policy-model';

export const NetworkPolicyPorts: React.FunctionComponent<NetworkPolicyPortsProps> = (props) => {
  const { ports, onChange } = props;
  const { t } = useTranslation();

  const onSingleChange = (port: NetworkPolicyPort, index: number) => {
    onChange([...ports.slice(0, index), port, ...ports.slice(index + 1)]);
  };

  const onRemove = (index: number) => {
    onChange([...ports.slice(0, index), ...ports.slice(index + 1)]);
  };

  return (
    <>
      {
        <div className="form-group co-create-networkpolicy__ports-list">
          <label>{t('console-app~Ports')}</label>
          <div className="help-block" id="ingress-peers-help">
            <p>
              {t(
                'console-app~Add ports to restrict traffic through them. If no ports are provided, your policy will make all ports accessible to traffic.',
              )}
            </p>
          </div>
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
                  aria-label={t('console-app~Remove port')}
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
              {t('console-app~Add port')}
            </Button>
          </div>
        </div>
      }
    </>
  );
};

type NetworkPolicyPortsProps = {
  ports: NetworkPolicyPort[];
  onChange: (ports: NetworkPolicyPort[]) => void;
};
