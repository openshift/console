import type { FC } from 'react';
import { useCallback } from 'react';
import { Form, TextInputTypes } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { FormSelectField } from '@console/shared/src/components/formik-fields/FormSelectField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { SwitchField } from '@console/shared/src/components/formik-fields/SwitchField';
import { TextAreaField } from '@console/shared/src/components/formik-fields/TextAreaField';
import type { AddBareMetalHostFormValues } from './types';

type AddBareMetalHostFormProps = FormikProps<AddBareMetalHostFormValues> & {
  isEditing: boolean;
  showUpdated: boolean;
};

const AddBareMetalHostForm: FC<AddBareMetalHostFormProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  isEditing,
  showUpdated,
  values,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('metal3-plugin');
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  return (
    <Form onSubmit={handleSubmit}>
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-name-input"
        name="name"
        label={t('Name')}
        placeholder="openshift-worker"
        helpText={t('Provide a unique name for the new Bare Metal Host.')}
        required
        isDisabled={isEditing}
      />
      <TextAreaField
        data-test-id="add-baremetal-host-form-description-input"
        name="description"
        label={t('Description')}
      />
      <FormSelectField
        data-test-id="add-baremetal-host-form-bootmode-input"
        name="bootMode"
        label={t('Boot mode')}
        options={[
          {
            value: 'UEFI',
            label: 'UEFI',
          },
          {
            value: 'UEFISecureBoot',
            label: 'UEFISecureBoot',
          },
          {
            value: 'legacy',
            label: 'Legacy',
          },
        ]}
      />
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-boot-mac-address-input"
        name="bootMACAddress"
        label={t('Boot MAC Address')}
        helpText={t(
          'The MAC address of the NIC connected to the network that will be used to provision the host.',
        )}
        required
      />
      <CheckboxField
        data-test-id="add-baremetal-host-form-enable-power-mgmt-input"
        name="enablePowerManagement"
        label={t('Enable power management')}
        helpText={t(
          'Provide credentials for the hosts baseboard management controller (BMC) device to enable OpenShift to control its power state. This is required for automatic machine health check remediation.',
        )}
      />
      {values.enablePowerManagement && (
        <>
          <InputField
            type={TextInputTypes.text}
            data-test-id="add-baremetal-host-form-bmc-address-input"
            name="BMCAddress"
            label={t('Baseboard Management Console (BMC) Address')}
            helpText={t(
              'The URL for communicating with the hosts baseboard management controller device.',
            )}
            required
          />
          <CheckboxField
            data-test-id="add-baremetal-host-form-disable-certificate-verification-input"
            name="disableCertificateVerification"
            label={t('Disable Certificate Verification')}
            helpText={t(
              'Disable verification of server certificates when using HTTPS to connect to the BMC. This is required when the server certificate is self-signed, but is insecure because it allows a man-in-the-middle to intercept the connection.',
            )}
          />
          <InputField
            type={TextInputTypes.text}
            data-test-id="add-baremetal-host-form-username-input"
            name="username"
            label={t('BMC Username')}
            required
          />
          <InputField
            type={TextInputTypes.password}
            data-test-id="add-baremetal-host-form-password-input"
            name="password"
            label={t('BMC Password')}
            required
          />
          {!isEditing && (
            <SwitchField
              name="online"
              data-test-id="add-baremetal-host-form-online-switch"
              label={t('Power host on after creation')}
            />
          )}
        </>
      )}
      <FormFooter
        isSubmitting={isSubmitting}
        handleReset={showUpdated && handleReset}
        handleCancel={handleCancel}
        submitLabel={isEditing ? t('Save') : t('Create')}
        errorMessage={status && status.submitError}
        disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
        infoTitle={t('Bare Metal Host has been updated')}
        infoMessage={t('Click reload to see the recent changes')}
        showAlert={showUpdated}
      />
    </Form>
  );
};

export default AddBareMetalHostForm;
