import * as React from 'react';
import { Checkbox, FormGroup, Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  InsecureTrafficTypes,
  PassthroughInsecureTrafficTypes,
  TerminationTypes,
} from '../import/import-types';
import { usePreferredRoutingOptions } from './usePreferredRoutingOptions';

const SecureRouteFields: React.FC = () => {
  const { t } = useTranslation();
  const [
    preferredRoutingOptions,
    setPreferredRoutingOptions,
    preferredRoutingOptionsLoaded,
  ] = usePreferredRoutingOptions();
  const { secure, tlsTermination, insecureTraffic } =
    preferredRoutingOptionsLoaded && preferredRoutingOptions;
  const [isTLSTerminationOpen, setIsTLSTerminationOpen] = React.useState<boolean>(false);
  const [isInsecureTrafficOpen, setIsInsecureTrafficOpen] = React.useState<boolean>(false);

  const tlsTerminationSelectOptions: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(TerminationTypes).map((tlsTerminationOption) => (
        <SelectOption key={tlsTerminationOption} value={tlsTerminationOption}>
          {TerminationTypes[tlsTerminationOption]}
        </SelectOption>
      )),
    [],
  );

  const insecureTrafficSelectOptions: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(InsecureTrafficTypes).map((insecureTrafficOption) => (
        <SelectOption key={insecureTrafficOption} value={insecureTrafficOption}>
          {InsecureTrafficTypes[insecureTrafficOption]}
        </SelectOption>
      )),
    [],
  );

  const passthroughInsecureTrafficTypesSelectOptions: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(PassthroughInsecureTrafficTypes).map((passthroughInsecureTraffic) => (
        <SelectOption key={passthroughInsecureTraffic} value={passthroughInsecureTraffic}>
          {PassthroughInsecureTrafficTypes[passthroughInsecureTraffic]}
        </SelectOption>
      )),
    [],
  );

  const onSecureRouteChecked = React.useCallback(
    (checked: boolean) => {
      setPreferredRoutingOptions({
        secure: checked,
        tlsTermination,
        insecureTraffic,
      });
    },
    [insecureTraffic, setPreferredRoutingOptions, tlsTermination],
  );

  const onTLSTerminationToggle = React.useCallback(
    (isOpen: boolean) => setIsTLSTerminationOpen(isOpen),
    [],
  );

  const onInsecureTrafficToggle = React.useCallback(
    (isOpen: boolean) => setIsInsecureTrafficOpen(isOpen),
    [],
  );

  const onTLSTerminationSelect = React.useCallback(
    (_, selection: string) => {
      setPreferredRoutingOptions({
        secure,
        tlsTermination: selection,
        insecureTraffic,
      });
      setIsTLSTerminationOpen(false);
    },
    [insecureTraffic, secure, setPreferredRoutingOptions],
  );

  const onInsecureTrafficSelect = React.useCallback(
    (_, selection: string) => {
      setPreferredRoutingOptions({
        secure,
        tlsTermination,
        insecureTraffic: selection,
      });
      setIsInsecureTrafficOpen(false);
    },
    [secure, setPreferredRoutingOptions, tlsTermination],
  );

  return (
    <div className="pf-c-form">
      <span className="co-help-text">
        {t(
          'devconsole~The defaults below will only apply to the Import from Git and Deploy Image forms when creating Deployments or Deployment Configs.',
        )}
      </span>
      <Checkbox
        id="secure-route-checkbox"
        data-test="secure-route-checkbox"
        label={t('devconsole~Secure route')}
        isChecked={secure}
        data-checked-state={secure}
        onChange={onSecureRouteChecked}
        aria-label={t('devconsole~Secure route')}
        description={t(
          'devconsole~Routes can be secured using several TLS termination types for serving certificates.',
        )}
        isDisabled={!preferredRoutingOptionsLoaded}
        className="odc-secure-route-fields__secure-route"
      />

      <FormGroup fieldId="tls-termination" label={t('devconsole~TLS termination')}>
        <Select
          id="tls-termination"
          variant={SelectVariant.single}
          isOpen={isTLSTerminationOpen}
          selections={tlsTermination}
          toggleId="tls-termination"
          onToggle={onTLSTerminationToggle}
          onSelect={onTLSTerminationSelect}
          placeholderText={t('devconsole~Select termination type')}
          isDisabled={!preferredRoutingOptionsLoaded}
          aria-label={t('devconsole~Select termination type')}
          maxHeight={300}
        >
          {tlsTerminationSelectOptions}
        </Select>
      </FormGroup>
      <FormGroup
        fieldId="insecure-traffic"
        label={t('devconsole~Insecure traffic')}
        helperText={t('devconsole~Policy for traffic on insecure schemes like HTTP.')}
      >
        <Select
          id="insecure-traffic"
          variant={SelectVariant.single}
          isOpen={isInsecureTrafficOpen}
          selections={insecureTraffic}
          toggleId="insecure-traffic"
          onToggle={onInsecureTrafficToggle}
          onSelect={onInsecureTrafficSelect}
          placeholderText={t('devconsole~Select insecure traffic type')}
          isDisabled={!preferredRoutingOptionsLoaded}
          aria-label={t('devconsole~Select insecure traffic type')}
          maxHeight={300}
        >
          {tlsTermination === 'passthrough'
            ? passthroughInsecureTrafficTypesSelectOptions
            : insecureTrafficSelectOptions}
        </Select>
      </FormGroup>
    </div>
  );
};

export default SecureRouteFields;
