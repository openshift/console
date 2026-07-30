import type { FC, FormEvent, Ref, CSSProperties } from 'react';
import { useState, useMemo, useCallback } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
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
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  TerminationType,
  InsecureTrafficType,
  PassthroughInsecureTrafficType,
} from '../import/import-types';
import {
  PREFERRED_SECURE_ROUTING_OPTIONS_USER_PREFERENCE_KEY,
  usePreferredRoutingOptions,
} from './usePreferredRoutingOptions';

const SecureRouteFields: FC = () => {
  const { t } = useTranslation('devconsole');
  const fireTelemetryEvent = useTelemetry();
  const [
    preferredRoutingOptions,
    setPreferredRoutingOptions,
    preferredRoutingOptionsLoaded,
  ] = usePreferredRoutingOptions();
  const { secure, tlsTermination, insecureTraffic } =
    preferredRoutingOptionsLoaded && preferredRoutingOptions;
  const [isTLSTerminationOpen, setIsTLSTerminationOpen] = useState<boolean>(false);
  const [isInsecureTrafficOpen, setIsInsecureTrafficOpen] = useState<boolean>(false);

  const terminationOptions = useMemo(() => {
    return {
      [TerminationType.EDGE]: t('Edge'),
      [TerminationType.PASSTHROUGH]: t('Passthrough'),
      [TerminationType.REENCRYPT]: t('Re-encrypt'),
    };
  }, [t]);

  const tlsTerminationSelectOptions: JSX.Element[] = useMemo(() => {
    return Object.keys(terminationOptions).map((tlsTerminationOption) => (
      <SelectOption key={tlsTerminationOption} value={tlsTerminationOption}>
        {terminationOptions[tlsTerminationOption]}
      </SelectOption>
    ));
  }, [terminationOptions]);

  const insecureTrafficOptions = useMemo(() => {
    return tlsTermination === TerminationType.PASSTHROUGH
      ? {
          [PassthroughInsecureTrafficType.None]: t('None'),
          [PassthroughInsecureTrafficType.Redirect]: t('Redirect'),
        }
      : {
          [InsecureTrafficType.None]: t('None'),
          [InsecureTrafficType.Allow]: t('Allow'),
          [InsecureTrafficType.Redirect]: t('Redirect'),
        };
  }, [t, tlsTermination]);

  const insecureTrafficSelectOptions: JSX.Element[] = useMemo(() => {
    return Object.keys(insecureTrafficOptions).map((insecureTrafficOption) => (
      <SelectOption key={insecureTrafficOption} value={insecureTrafficOption}>
        {insecureTrafficOptions[insecureTrafficOption]}
      </SelectOption>
    ));
  }, [insecureTrafficOptions]);

  const onSecureRouteChecked = useCallback(
    (_event: FormEvent<HTMLInputElement>, checked: boolean) => {
      setPreferredRoutingOptions({
        secure: checked,
        tlsTermination,
        insecureTraffic,
      });
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_PREFERENCE_KEY,
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

  const onTLSTerminationSelect = useCallback(
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
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_PREFERENCE_KEY,
      });
    },
    [fireTelemetryEvent, insecureTraffic, secure, setPreferredRoutingOptions],
  );

  const onInsecureTrafficSelect = useCallback(
    (_, selection: string) => {
      setPreferredRoutingOptions({
        secure,
        tlsTermination,
        insecureTraffic: selection.toString(),
      });
      setIsInsecureTrafficOpen(false);
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_SECURE_ROUTING_OPTIONS_USER_PREFERENCE_KEY,
      });
    },
    [fireTelemetryEvent, secure, setPreferredRoutingOptions, tlsTermination],
  );

  const tlsTerminationToggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      id="tls-termination"
      ref={toggleRef}
      onClick={onTLSTerminationToggle}
      isExpanded={isTLSTerminationOpen}
      isDisabled={!preferredRoutingOptionsLoaded}
      aria-label={t('Select termination type')}
      style={
        {
          maxHeight: '300px',
        } as CSSProperties
      }
    >
      {terminationOptions[tlsTermination]}
    </MenuToggle>
  );

  const insecureTrafficToggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      ref={toggleRef}
      id="insecure-traffic"
      onClick={onInsecureTrafficToggle}
      isExpanded={isInsecureTrafficOpen}
      isDisabled={!preferredRoutingOptionsLoaded}
      aria-label={t('Select insecure traffic type')}
      style={
        {
          maxHeight: '300px',
        } as CSSProperties
      }
    >
      {insecureTrafficOptions[insecureTraffic]}
    </MenuToggle>
  );

  return (
    <div className="pf-v6-c-form">
      <span>
        {t(
          'The defaults below will only apply to the Import from Git and Deploy Image forms when creating Deployments or Deployment Configs.',
        )}
      </span>
      <Checkbox
        id="secure-route-checkbox"
        data-test="secure-route-checkbox"
        label={t('Secure route')}
        isChecked={secure}
        data-checked-state={secure}
        onChange={onSecureRouteChecked}
        aria-label={t('Secure route')}
        description={t(
          'Routes can be secured using several TLS termination types for serving certificates.',
        )}
        isDisabled={!preferredRoutingOptionsLoaded}
        className="odc-secure-route-fields__secure-route"
      />

      <FormGroup fieldId="tls-termination" label={t('TLS termination')}>
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
      <FormGroup fieldId="insecure-traffic" label={t('Insecure traffic')}>
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
              {t('Policy for traffic on insecure schemes like HTTP.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </div>
  );
};

export default SecureRouteFields;
