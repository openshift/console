import * as React from 'react';
import { Alert, AlertActionCloseButton, Button } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { NetworkPolicyIPBlock } from './network-policy-model';

export const NetworkPolicyPeerIPBlock: React.FunctionComponent<PeerIPBlockProps> = (props) => {
  const { t } = useTranslation();
  const { onChange, ipBlock } = props;
  const [showSDNAlert, setShowSDNAlert] = React.useState(true);

  const handleCIDRChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ipBlock.cidr = event.currentTarget.value;
    onChange(ipBlock);
  };

  const handleExceptionsChange = (idx: number, value: string) => {
    ipBlock.except[idx].value = value;
    onChange(ipBlock);
  };

  return (
    <>
      <div className="form-group co-create-networkpolicy__ipblock">
        <label className="co-required" htmlFor="cidr">
          {t('public~CIDR')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          onChange={handleCIDRChange}
          value={ipBlock.cidr}
          placeholder="10.2.1.0/16"
          id="cidr"
          name="cidr"
          aria-describedby="ipblock-help"
          required
        />
      </div>
      <div className="form-group co-create-networkpolicy__exceptions">
        <label>{t('public~Exceptions')}</label>
        {showSDNAlert && (
          <div>
            <Alert
              variant="info"
              title={t(
                'public~When using the OpenShift SDN cluster network provider, exceptions are not supported and would cause the entire IP block section to be ignored.',
              )}
              actionClose={<AlertActionCloseButton onClose={() => setShowSDNAlert(false)} />}
            />
          </div>
        )}
        {ipBlock.except.map((exc, idx) => (
          <div className="pf-c-input-group" key={exc.key}>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(event) => handleExceptionsChange(idx, event.currentTarget.value)}
              placeholder="10.2.1.0/12"
              aria-describedby="ports-help"
              name={`exception-${idx}`}
              id={`exception-${idx}`}
              value={exc.value}
            />
            <Button
              aria-label={t('public~Remove exception')}
              className="co-create-networkpolicy__remove-exception"
              onClick={() => {
                ipBlock.except = [
                  ...ipBlock.except.slice(0, idx),
                  ...ipBlock.except.slice(idx + 1),
                ];
                onChange(ipBlock);
              }}
              type="button"
              variant="plain"
            >
              <MinusCircleIcon />
            </Button>
          </div>
        ))}
        <div className="co-toolbar__group co-toolbar__group--left co-create-networkpolicy__add-exception">
          <Button
            className="pf-m-link--align-left"
            onClick={() => {
              ipBlock.except.push({ key: _.uniqueId('exception-'), value: '' });
              onChange(ipBlock);
            }}
            type="button"
            variant="link"
          >
            <PlusCircleIcon className="co-icon-space-r" />
            {t('public~Add exception')}
          </Button>
        </div>
      </div>
    </>
  );
};

type PeerIPBlockProps = {
  direction: 'ingress' | 'egress';
  ipBlock: NetworkPolicyIPBlock;
  onChange: (ipBlock: NetworkPolicyIPBlock) => void;
};
