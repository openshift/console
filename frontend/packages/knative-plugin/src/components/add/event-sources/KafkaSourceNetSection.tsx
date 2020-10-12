import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { CheckboxField } from '@console/shared';
import SecretKeySelector from '../SecretKeySelector';
import { EventSources } from '../import-types';

const KafkaSourceNetSection: React.FC = () => {
  const {
    values: { data },
  } = useFormikContext<FormikValues>();
  const kafkaSource = EventSources.KafkaSource;
  const saslEnable = data?.[kafkaSource]?.net?.sasl?.enable;
  const tlsEnable = data?.[kafkaSource]?.net?.tls?.enable;

  return (
    <>
      <h3 className="co-section-heading-tertiary">Net</h3>
      <CheckboxField
        data-test-id="kafkasource-sasl-field"
        name={`data.${kafkaSource}.net.sasl.enable`}
        formLabel="SASL"
        label="Enable"
      />
      {saslEnable && (
        <>
          <SecretKeySelector name={`data.${kafkaSource}.net.sasl.user.secretKeyRef`} label="User" />
          <SecretKeySelector
            name={`data.${kafkaSource}.net.sasl.password.secretKeyRef`}
            label="Password"
          />
        </>
      )}
      <CheckboxField
        data-test-id="kafkasource-tls-field"
        name={`data.${kafkaSource}.net.tls.enable`}
        formLabel="TLS"
        label="Enable"
      />
      {tlsEnable && (
        <>
          <SecretKeySelector
            name={`data.${kafkaSource}.net.tls.caCert.secretKeyRef`}
            label="CA Certificate"
          />
          <SecretKeySelector
            name={`data.${kafkaSource}.net.tls.cert.secretKeyRef`}
            label="Certificate"
          />
          <SecretKeySelector name={`data.${kafkaSource}.net.tls.key.secretKeyRef`} label="Key" />
        </>
      )}
    </>
  );
};

export default KafkaSourceNetSection;
