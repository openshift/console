import * as React from 'react';
import { FormHelperText, Title } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField, DroppableFileInputField, CheckboxField } from '@console/shared';
import { usePreferredRoutingOptions } from '../../user-preferences/usePreferredRoutingOptions';
import {
  TerminationType,
  PassthroughInsecureTrafficType,
  InsecureTrafficType,
} from '../import-types';

const SecureRoute: React.FC = () => {
  const { t } = useTranslation();
  const [preferredRoutingOptions, , preferredRoutingOptionsLoaded] = usePreferredRoutingOptions();
  const { secure: secureRoute, tlsTermination, insecureTraffic } =
    preferredRoutingOptionsLoaded && preferredRoutingOptions;
  const {
    values: {
      formType,
      route: { secure, tls },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const terminationOptions = {
    [TerminationType.EDGE]: t('devconsole~Edge'),
    [TerminationType.PASSTHROUGH]: t('devconsole~Passthrough'),
    [TerminationType.REENCRYPT]: t('devconsole~Re-encrypt'),
  };
  const insecureTrafficOptions =
    tls.termination === TerminationType.PASSTHROUGH
      ? {
          [PassthroughInsecureTrafficType.None]: t('devconsole~None'),
          [PassthroughInsecureTrafficType.Redirect]: t('devconsole~Redirect'),
        }
      : {
          [InsecureTrafficType.None]: t('devconsole~None'),
          [InsecureTrafficType.Allow]: t('devconsole~Allow'),
          [InsecureTrafficType.Redirect]: t('devconsole~Redirect'),
        };

  React.useEffect(() => {
    if (formType !== 'edit' && preferredRoutingOptionsLoaded) {
      setFieldValue('route.secure', secureRoute, false);
      setFieldValue('route.tls.termination', tlsTermination, false);
      setFieldValue('route.tls.insecureEdgeTerminationPolicy', insecureTraffic, true);
    }
  }, [
    formType,
    insecureTraffic,
    preferredRoutingOptionsLoaded,
    secureRoute,
    setFieldValue,
    tlsTermination,
  ]);
  return (
    <>
      <CheckboxField
        name="route.secure"
        label={t('devconsole~Secure Route')}
        formLabel={t('devconsole~Security')}
        helpText={t(
          'devconsole~Routes can be secured using several TLS termination types for serving certificates.',
        )}
      />
      {secure && (
        <>
          <DropdownField
            name="route.tls.termination"
            label={t('devconsole~TLS termination')}
            items={terminationOptions}
            title={t('devconsole~Select termination type')}
            fullWidth
          />
          <DropdownField
            name="route.tls.insecureEdgeTerminationPolicy"
            label={t('devconsole~Insecure traffic')}
            items={insecureTrafficOptions}
            title={t('devconsole~Select insecure traffic type')}
            helpText={t('devconsole~Policy for traffic on insecure schemes like HTTP.')}
            fullWidth
          />
          {tls.termination && tls.termination !== 'passthrough' && (
            <>
              <Title headingLevel="h3" className="pf-v6-u-mb-sm">
                {t('devconsole~Certificates')}
              </Title>
              <FormHelperText>
                {t(
                  "devconsole~TLS certificates for edge and re-encrypt termination. If not specified, the router's default certificate is used.",
                )}
              </FormHelperText>
              <DroppableFileInputField
                name="route.tls.certificate"
                label={t('devconsole~Certificate')}
                helpText={t(
                  'devconsole~The PEM format certificate. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              <DroppableFileInputField
                name="route.tls.key"
                label={t('devconsole~Private Key')}
                helpText={t(
                  'devconsole~The PEM format key. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              <DroppableFileInputField
                name="route.tls.caCertificate"
                label={t('devconsole~CA certificate')}
                helpText={t(
                  'devconsole~The PEM format CA certificate chain. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              {tls.termination === 'reencrypt' && (
                <DroppableFileInputField
                  name="route.tls.destinationCaCertificate"
                  label={t('devconsole~Destination CA Certificate')}
                  helpText={t(
                    'devconsole~The PEM format CA certificate chain to validate the endpoint certificate for re-encrypt termination. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default SecureRoute;
