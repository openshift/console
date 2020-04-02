import * as React from 'react';
import { CheckboxField } from '@console/shared';
import { useFormikContext, FormikValues } from 'formik';
import SecretKeySelector from './SecretKeySelector';

const KafkaSourceNetSection: React.FC = () => {
  const {
    values: { data },
  } = useFormikContext<FormikValues>();

  const saslEnable = data?.kafkasource?.spec?.net?.sasl?.enable;
  const tlsEnable = data?.kafkasource?.spec?.net?.tls?.enable;

  return (
    <>
      <h3 className="co-section-heading-tertiary">Net</h3>
      <CheckboxField
        data-test-id="kafkasource-sasl-field"
        name="data.kafkasource.spec.net.sasl.enable"
        formLabel="SASL"
        label="Enable"
      />
      {saslEnable && (
        <>
          <SecretKeySelector name="data.kafkasource.spec.net.sasl.user.secretKeyRef" label="User" />
          <SecretKeySelector
            name="data.kafkasource.spec.net.sasl.password.secretKeyRef"
            label="Password"
          />
        </>
      )}
      <CheckboxField
        data-test-id="kafkasource-tls-field"
        name="data.kafkasource.spec.net.tls.enable"
        formLabel="TLS"
        label="Enable"
      />
      {tlsEnable && (
        <>
          <SecretKeySelector
            name="data.kafkasource.spec.net.tls.caCert.secretKeyRef"
            label="CA Certificate"
          />
          <SecretKeySelector
            name="data.kafkasource.spec.net.tls.cert.secretKeyRef"
            label="Certificate"
          />
          <SecretKeySelector name="data.kafkasource.spec.net.tls.key.secretKeyRef" label="Key" />
        </>
      )}
    </>
  );
};

export default KafkaSourceNetSection;
