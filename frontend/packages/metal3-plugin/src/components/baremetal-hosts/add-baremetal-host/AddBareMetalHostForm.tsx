import * as React from 'react';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import {
  InputField,
  TextAreaField,
  SwitchField,
  FormFooter,
  CheckboxField,
} from '@console/shared/src';
import { AddBareMetalHostFormValues } from './types';

type AddBareMetalHostFormProps = FormikProps<AddBareMetalHostFormValues> & {
  isEditing: boolean;
  showUpdated: boolean;
};

const AddBareMetalHostForm: React.FC<AddBareMetalHostFormProps> = ({
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
  const { t } = useTranslation();
  return (
    <Form onSubmit={handleSubmit}>
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-name-input"
        name="name"
        label={t('metal3-plugin~Name')}
        placeholder="openshift-worker"
        helpText={t('metal3-plugin~Provide a unique name for the new Bare Metal Host.')}
        required
        isDisabled={isEditing}
      />
      <TextAreaField
        data-test-id="add-baremetal-host-form-description-input"
        name="description"
        label={t('metal3-plugin~Description')}
      />
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-boot-mac-address-input"
        name="bootMACAddress"
        label={t('metal3-plugin~Boot MAC Address')}
        helpText={t(
          'metal3-plugin~The MAC address of the NIC connected to the network that will be used to provision the host.',
        )}
        required
      />
      <CheckboxField
        data-test-id="add-baremetal-host-form-enable-power-mgmt-input"
        name="enablePowerManagement"
        label={t('metal3-plugin~Enable power management')}
        helpText={t(
          'metal3-plugin~Provide credentials for the hosts baseboard management controller (BMC) device to enable OpenShift to control its power state. This is required for automatic machine health check remediation.',
        )}
      />
      {values.enablePowerManagement && (
        <>
          <InputField
            type={TextInputTypes.text}
            data-test-id="add-baremetal-host-form-bmc-address-input"
            name="BMCAddress"
            label={t('metal3-plugin~Baseboard Management Console (BMC) Address')}
            helpText={t(
              'metal3-plugin~The URL for communicating with the hosts baseboard management controller device.',
            )}
            required
          />
          <CheckboxField
            data-test-id="add-baremetal-host-form-disable-certificate-verification-input"
            name="disableCertificateVerification"
            label={t('metal3-plugin~Disable Certificate Verification')}
            helpText={t(
              'metal3-plugin~Disable verification of server certificates when using HTTPS to connect to the BMC. This is required when the server certificate is self-signed, but is insecure because it allows a man-in-the-middle to intercept the connection.',
            )}
          />
          <InputField
            type={TextInputTypes.text}
            data-test-id="add-baremetal-host-form-username-input"
            name="username"
            label={t('metal3-plugin~BMC Username')}
            required
          />
          <InputField
            type={TextInputTypes.password}
            data-test-id="add-baremetal-host-form-password-input"
            name="password"
            label={t('metal3-plugin~BMC Password')}
            required
          />
          {!isEditing && (
            <SwitchField
              name="online"
              data-test-id="add-baremetal-host-form-online-switch"
              label={t('metal3-plugin~Power host on after creation')}
            />
          )}
        </>
      )}
      <FormFooter
        isSubmitting={isSubmitting}
        handleReset={showUpdated && handleReset}
        handleCancel={history.goBack}
        submitLabel={isEditing ? t('metal3-plugin~Save') : t('metal3-plugin~Create')}
        errorMessage={status && status.submitError}
        disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
        infoTitle={t('metal3-plugin~Bare Metal Host has been updated')}
        infoMessage={t('metal3-plugin~Click reload to see the recent changes')}
        showAlert={showUpdated}
      />
    </Form>
  );
};

export default AddBareMetalHostForm;
