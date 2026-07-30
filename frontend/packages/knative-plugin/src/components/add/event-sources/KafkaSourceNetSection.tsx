import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { EventSources } from '../import-types';
import SecretKeySelector from '../SecretKeySelector';

const KafkaSourceNetSection: FC = () => {
  const { t } = useTranslation('knative-plugin');
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
      <TertiaryHeading>Net</TertiaryHeading>
      <CheckboxField
        data-test-id="kafkasource-sasl-field"
        name={`formData.data.${kafkaSource}.net.sasl.enable`}
        formLabel="SASL"
        label={t('Enable')}
      />
      {saslEnable && (
        <>
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.sasl.user.secretKeyRef`}
            label="User"
          />
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.sasl.password.secretKeyRef`}
            label={t('Password')}
          />
        </>
      )}
      <CheckboxField
        data-test-id="kafkasource-tls-field"
        name={`formData.data.${kafkaSource}.net.tls.enable`}
        formLabel="TLS"
        label={t('Enable')}
      />
      {tlsEnable && (
        <>
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.tls.caCert.secretKeyRef`}
            label={t('CA certificate')}
          />
          <SecretKeySelector
            name={`formData.data.${kafkaSource}.net.tls.cert.secretKeyRef`}
            label={t('Certificate')}
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
