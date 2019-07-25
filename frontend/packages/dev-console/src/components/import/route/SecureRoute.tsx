import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { FormHelperText } from '@patternfly/react-core';
import { DropdownField, DroppableFileInputField, CheckboxField } from '../../formik-fields';
import {
  TerminationTypes,
  PassthroughInsecureTrafficTypes,
  InsecureTrafficTypes,
} from '../import-types';

const SecureRoute: React.FC = () => {
  const {
    values: {
      route: { secure, tls },
    },
  } = useFormikContext<FormikValues>();
  return (
    <React.Fragment>
      <CheckboxField
        name="route.secure"
        label="Secure Route"
        formLabel="Security"
        helpText="Routes can be secured using several TLS termination types for serving certificates."
      />
      {secure && (
        <React.Fragment>
          <DropdownField
            name="route.tls.termination"
            label="TLS Termination"
            items={TerminationTypes}
            title="Select termination type"
            fullWidth
          />
          <DropdownField
            name="route.tls.insecureEdgeTerminationPolicy"
            label="Insecure Traffic"
            items={
              tls.termination === 'passthrough'
                ? PassthroughInsecureTrafficTypes
                : InsecureTrafficTypes
            }
            title="Select insecure traffic type"
            helpText="Policy for traffic on insecure schemes like HTTP."
            fullWidth
          />
          {tls.termination && tls.termination !== 'passthrough' && (
            <React.Fragment>
              <h3>Certificates</h3>
              <FormHelperText isHidden={false}>
                TLS certificates for edge and re-encrypt termination. If not specified, the
                router&apos;s default certificate is used.
              </FormHelperText>
              <DroppableFileInputField
                name="route.tls.certificate"
                label="Certificate"
                helpText="The PEM format certificate. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
              />
              <DroppableFileInputField
                name="route.tls.privateKey"
                label="Private Key"
                helpText="The PEM format key. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
              />
              <DroppableFileInputField
                name="route.tls.caCertificate"
                label="CA Certificate"
                helpText="The PEM format CA certificate chain. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
              />
              {tls.termination === 'reencrypt' && (
                <DroppableFileInputField
                  name="route.tls.destinationCaCertificate"
                  label="Destination CA Certificate"
                  helpText="The PEM format CA certificate chain to validate the endpoint certificate for re-encrypt termination. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
                />
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default SecureRoute;
