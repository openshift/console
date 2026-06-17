import type { FC } from 'react';
import { useEffect } from 'react';
import { FormHelperText, Title } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { DroppableFileInputField } from '@console/shared/src/components/formik-fields/DroppableFileInputField';
import { usePreferredRoutingOptions } from '../../user-preferences/usePreferredRoutingOptions';
import {
  TerminationType,
  PassthroughInsecureTrafficType,
  InsecureTrafficType,
} from '../import-types';

const SecureRoute: FC = () => {
  const { t } = useTranslation('devconsole');
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
    [TerminationType.EDGE]: t('Edge'),
    [TerminationType.PASSTHROUGH]: t('Passthrough'),
    [TerminationType.REENCRYPT]: t('Re-encrypt'),
  };
  const insecureTrafficOptions =
    tls.termination === TerminationType.PASSTHROUGH
      ? {
          [PassthroughInsecureTrafficType.None]: t('None'),
          [PassthroughInsecureTrafficType.Redirect]: t('Redirect'),
        }
      : {
          [InsecureTrafficType.None]: t('None'),
          [InsecureTrafficType.Allow]: t('Allow'),
          [InsecureTrafficType.Redirect]: t('Redirect'),
        };

  useEffect(() => {
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
        label={t('Secure Route')}
        formLabel={t('Security')}
        helpText={t(
          'Routes can be secured using several TLS termination types for serving certificates.',
        )}
      />
      {secure && (
        <>
          <DropdownField
            name="route.tls.termination"
            label={t('TLS termination')}
            items={terminationOptions}
            title={t('Select termination type')}
            fullWidth
          />
          <DropdownField
            name="route.tls.insecureEdgeTerminationPolicy"
            label={t('Insecure traffic')}
            items={insecureTrafficOptions}
            title={t('Select insecure traffic type')}
            helpText={t('Policy for traffic on insecure schemes like HTTP.')}
            fullWidth
          />
          {tls.termination && tls.termination !== 'passthrough' && (
            <>
              <Title headingLevel="h3" className="pf-v6-u-mb-sm">
                {t('Certificates')}
              </Title>
              <FormHelperText>
                {t(
                  "TLS certificates for edge and re-encrypt termination. If not specified, the router's default certificate is used.",
                )}
              </FormHelperText>
              <DroppableFileInputField
                name="route.tls.certificate"
                label={t('Certificate')}
                helpText={t(
                  'The PEM format certificate. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              <DroppableFileInputField
                name="route.tls.key"
                label={t('Private Key')}
                helpText={t(
                  'The PEM format key. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              <DroppableFileInputField
                name="route.tls.caCertificate"
                label={t('CA certificate')}
                helpText={t(
                  'The PEM format CA certificate chain. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
                )}
              />
              {tls.termination === 'reencrypt' && (
                <DroppableFileInputField
                  name="route.tls.destinationCaCertificate"
                  label={t('Destination CA Certificate')}
                  helpText={t(
                    'The PEM format CA certificate chain to validate the endpoint certificate for re-encrypt termination. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
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
