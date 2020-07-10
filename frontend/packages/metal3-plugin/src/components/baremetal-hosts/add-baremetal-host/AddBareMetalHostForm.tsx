import * as React from 'react';
import * as _ from 'lodash';
import { history } from '@console/internal/components/utils';
import { FormikProps } from 'formik';
import { Form, TextInputTypes } from '@patternfly/react-core';
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
}) => (
  <Form onSubmit={handleSubmit}>
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-name-input"
      name="name"
      label="Name"
      placeholder="openshift-worker"
      helpText="Provide a unique name for the new Bare Metal Host."
      required
      isDisabled={isEditing}
    />
    <TextAreaField
      data-test-id="add-baremetal-host-form-description-input"
      name="description"
      label="Description"
    />
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-boot-mac-address-input"
      name="bootMACAddress"
      label="Boot MAC Address"
      helpText="The MAC address of the NIC connected to the network that will be used to provision the host."
      required
    />
    <CheckboxField
      data-test-id="add-baremetal-host-form-enable-power-mgmt-input"
      name="enablePowerManagement"
      label="Enable power management"
      helpText="Provide credentials for the host's baseboard management controller (BMC) device to enable OpenShift to control its power state. This is required for automatic machine health check remediation."
    />
    {values.enablePowerManagement && (
      <>
        <InputField
          type={TextInputTypes.text}
          data-test-id="add-baremetal-host-form-bmc-address-input"
          name="BMCAddress"
          label="Baseboard Management Console (BMC) Address"
          helpText="The URL for communicating with the host's baseboard management controller device."
          required
        />
        <CheckboxField
          data-test-id="add-baremetal-host-form-disable-certificate-verification-input"
          name="disableCertificateVerification"
          label="Disable Certificate Verification"
          helpText="Disable verification of server certificates when using HTTPS to connect to the BMC. This is required when the server certificate is self-signed, but is insecure because it allows a man-in-the-middle to intercept the connection."
        />
        <InputField
          type={TextInputTypes.text}
          data-test-id="add-baremetal-host-form-username-input"
          name="username"
          label="BMC Username"
          required
        />
        <InputField
          type={TextInputTypes.password}
          data-test-id="add-baremetal-host-form-password-input"
          name="password"
          label="BMC Password"
          required
        />
        {!isEditing && (
          <SwitchField
            name="online"
            data-test-id="add-baremetal-host-form-online-switch"
            label="Power host on after creation"
          />
        )}
      </>
    )}
    <FormFooter
      isSubmitting={isSubmitting}
      handleReset={showUpdated && handleReset}
      handleCancel={history.goBack}
      submitLabel={isEditing ? 'Save' : 'Create'}
      errorMessage={status && status.submitError}
      disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
      infoTitle={'Bare Metal Host has been updated'}
      infoMessage={'Click reload to see the recent changes'}
      showAlert={showUpdated}
    />
  </Form>
);

export default AddBareMetalHostForm;
