import * as React from 'react';
import {
  Checkbox,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  TerminationType,
  InsecureTrafficType,
  PassthroughInsecureTrafficType,
} from '../import/import-types';
import {
  PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY,
  usePreferredRoutingOptions,
} from './usePreferredRoutingOptions';

const SecureRouteFields: React.FC = () => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [
    preferredRoutingOptions,
    setPreferredRoutingOptions,
    preferredRoutingOptionsLoaded,
  ] = usePreferredRoutingOptions();
  const { secure, tlsTermination, insecureTraffic } =
    preferredRoutingOptionsLoaded && preferredRoutingOptions;
  const [isTLSTerminationOpen, setIsTLSTerminationOpen] = React.useState<boolean>(false);
  const [isInsecureTrafficOpen, setIsInsecureTrafficOpen] = React.useState<boolean>(false);

  const terminationOptions = React.useMemo(() => {
    return {
      [TerminationType.EDGE]: t('devconsole~Edge'),
      [TerminationType.PASSTHROUGH]: t('devconsole~Passthrough'),
      [TerminationType.REENCRYPT]: t('devconsole~Re-encrypt'),
    };
  }, [t]);

  const tlsTerminationSelectOptions: JSX.Element[] = React.useMemo(() => {
    return Object.keys(terminationOptions).map((tlsTerminationOption) => (
      <SelectOption key={tlsTerminationOption} value={tlsTerminationOption}>
        {terminationOptions[tlsTerminationOption]}
      </SelectOption>
    ));
  }, [terminationOptions]);

  const insecureTrafficOptions = React.useMemo(() => {
    return tlsTermination === TerminationType.PASSTHROUGH
      ? {
          [PassthroughInsecureTrafficType.None]: t('devconsole~None'),
          [PassthroughInsecureTrafficType.Redirect]: t('devconsole~Redirect'),
        }
      : {
          [InsecureTrafficType.None]: t('devconsole~None'),
          [InsecureTrafficType.Allow]: t('devconsole~Allow'),
          [InsecureTrafficType.Redirect]: t('devconsole~Redirect'),
        };
  }, [t, tlsTermination]);

  const insecureTrafficSelectOptions: JSX.Element[] = React.useMemo(() => {
    return Object.keys(insecureTrafficOptions).map((insecureTrafficOption) => (
      <SelectOption key={insecureTrafficOption} value={insecureTrafficOption}>
        {insecureTrafficOptions[insecureTrafficOption]}
      </SelectOption>
    ));
  }, [insecureTrafficOptions]);

  const onSecureRouteChecked = React.useCallback(
    (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
      setPreferredRoutingOptions({
        secure: checked,
        tlsTermination,
        insecureTraffic,
      });
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY,
      });
    },
    [fireTelemetryEvent, insecureTraffic, setPreferredRoutingOptions, tlsTermination],
  );

  const onTLSTerminationToggle = () => {
    setIsTLSTerminationOpen(!isTLSTerminationOpen);
  };

  const onInsecureTrafficToggle = () => {
    setIsInsecureTrafficOpen(!isInsecureTrafficOpen);
  };

  const onTLSTerminationSelect = React.useCallback(
    (_, selection: string) => {
      if (typeof selection === 'undefined') {
        return;
      }

      setPreferredRoutingOptions({
        secure,
        tlsTermination: selection.toString(),
        insecureTraffic,
      });
      setIsTLSTerminationOpen(false);
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY,
      });
    },
    [fireTelemetryEvent, insecureTraffic, secure, setPreferredRoutingOptions],
  );

  const onInsecureTrafficSelect = React.useCallback(
    (_, selection: string) => {
      setPreferredRoutingOptions({
        secure,
        tlsTermination,
        insecureTraffic: selection.toString(),
      });
      setIsInsecureTrafficOpen(false);
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY,
      });
    },
    [fireTelemetryEvent, secure, setPreferredRoutingOptions, tlsTermination],
  );

  const tlsTerminationToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      id="tls-termination"
      ref={toggleRef}
      onClick={onTLSTerminationToggle}
      isExpanded={isTLSTerminationOpen}
      isDisabled={!preferredRoutingOptionsLoaded}
      placeholder={t('devconsole~Select termination type')}
      aria-label={t('devconsole~Select termination type')}
      style={
        {
          maxHeight: '300px',
        } as React.CSSProperties
      }
    >
      {terminationOptions[tlsTermination]}
    </MenuToggle>
  );

  const insecureTrafficToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      ref={toggleRef}
      id="insecure-traffic"
      onClick={onInsecureTrafficToggle}
      isExpanded={isInsecureTrafficOpen}
      isDisabled={!preferredRoutingOptionsLoaded}
      placeholder={t('devconsole~Select insecure traffic type')}
      aria-label={t('devconsole~Select insecure traffic type')}
      style={
        {
          maxHeight: '300px',
        } as React.CSSProperties
      }
    >
      {insecureTrafficOptions[insecureTraffic]}
    </MenuToggle>
  );

  return (
    <div className="pf-v6-c-form">
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
          id="tls-termination-select"
          isOpen={isTLSTerminationOpen}
          onSelect={onTLSTerminationSelect}
          selected={tlsTermination}
          onOpenChange={onTLSTerminationToggle}
          toggle={tlsTerminationToggle}
          shouldFocusToggleOnSelect
        >
          <SelectList>{tlsTerminationSelectOptions}</SelectList>
        </Select>
      </FormGroup>
      <FormGroup fieldId="insecure-traffic" label={t('devconsole~Insecure traffic')}>
        <Select
          id="insecure-traffic-select"
          isOpen={isInsecureTrafficOpen}
          selected={insecureTraffic}
          onSelect={onInsecureTrafficSelect}
          onOpenChange={onInsecureTrafficToggle}
          toggle={insecureTrafficToggle}
          shouldFocusToggleOnSelect
        >
          <SelectList>{insecureTrafficSelectOptions}</SelectList>
        </Select>

        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t('devconsole~Policy for traffic on insecure schemes like HTTP.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </div>
  );
};

export default SecureRouteFields;
