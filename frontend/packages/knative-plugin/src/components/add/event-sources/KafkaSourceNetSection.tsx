import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared';
import { EventSources } from '../import-types';
import SecretKeySelector from '../SecretKeySelector';

const KafkaSourceNetSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { data },
    },
  } = useFormikContext<FormikValues>();
  const kafkaSource = EventSources.KafkaSource;
  const saslEnable = data?.[kafkaSource]?.net?.sasl?.enable;
  const tlsEnable = data?.[kafkaSource]?.net?.tls?.enable;

  return (
    <>
      <h3 className="co-section-heading-tertiary">Net</h3>
      <CheckboxField
        data-test-id="kafkasource-sasl-field"
        name={`formData.data.${kafkaSource}.net.sasl.enable`}
        formLabel="SASL"
        label={t('knative-plugin~Enable')}
      />
      {saslEnable && (
        <>
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.sasl.user.secretKeyRef`}
            label="User"
          />
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.sasl.password.secretKeyRef`}
            label={t('knative-plugin~Password')}
          />
        </>
      )}
      <CheckboxField
        data-test-id="kafkasource-tls-field"
        name={`formData.data.${kafkaSource}.net.tls.enable`}
        formLabel="TLS"
        label={t('knative-plugin~Enable')}
      />
      {tlsEnable && (
        <>
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.tls.caCert.secretKeyRef`}
            label={t('knative-plugin~CA certificate')}
          />
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.tls.cert.secretKeyRef`}
            label={t('knative-plugin~Certificate')}
          />
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.tls.key.secretKeyRef`}
            label="Key"
          />
        </>
      )}
    </>
  );
};

export default KafkaSourceNetSection;
