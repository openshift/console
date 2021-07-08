import * as React from 'react';
import { FormHelperText } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField, DroppableFileInputField, CheckboxField } from '@console/shared';
import {
  TerminationTypes,
  PassthroughInsecureTrafficTypes,
  InsecureTrafficTypes,
} from '../import-types';

const SecureRoute: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      route: { secure, tls },
    },
  } = useFormikContext<FormikValues>();
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
            items={TerminationTypes}
            title={t('devconsole~Select termination type')}
            fullWidth
          />
          <DropdownField
            name="route.tls.insecureEdgeTerminationPolicy"
            label={t('devconsole~Insecure traffic')}
            items={
              tls.termination === 'passthrough'
                ? PassthroughInsecureTrafficTypes
                : InsecureTrafficTypes
            }
            title={t('devconsole~Select insecure traffic type')}
            helpText={t('devconsole~Policy for traffic on insecure schemes like HTTP.')}
            fullWidth
          />
          {tls.termination && tls.termination !== 'passthrough' && (
            <>
              <h3>{t('devconsole~Certificates')}</h3>
              <FormHelperText isHidden={false}>
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
                name="route.tls.privateKey"
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
