import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps } from 'formik';
import { Form, ActionGroup, Button, ButtonVariant, TextInputTypes } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { InputField, TextAreaField } from '@console/dev-console/src/components/formik-fields';
import { AddBareMetalHostFormValues } from './types';
import SwitchField from './SwitchField';

type AddBareMetalHostFormProps = FormikProps<AddBareMetalHostFormValues>;

const AddBareMetalHostForm: React.FC<AddBareMetalHostFormProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
}) => {
  return (
    <Form onSubmit={handleSubmit}>
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-name-input"
        name="name"
        label="Name"
        placeholder="openshift-worker"
        helpText="Provide unique name for the new Bare Metal Host."
        required
      />
      <TextAreaField
        data-test-id="add-baremetal-host-form-description-input"
        name="description"
        label="Description"
      />
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-bmc-address-input"
        name="BMCAddress"
        label="BMC Address"
        helpText="The URL for communicating with the BMC (Baseboard Management Controller) on the host, based on the provider being used."
        required
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
      <InputField
        type={TextInputTypes.text}
        data-test-id="add-baremetal-host-form-boot-mac-address-input"
        name="bootMACAddress"
        label="Boot MAC Address"
        helpText="The MAC address of the NIC connected to the network that will be used to provision the host."
        required
      />
      <SwitchField
        name="online"
        data-test-id="add-baremetal-host-form-online-switch"
        label="Power host on after creation"
      />
      <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
        <ActionGroup className="pf-c-form">
          <Button
            type="submit"
            variant={ButtonVariant.primary}
            isDisabled={!dirty || !_.isEmpty(errors)}
            data-test-id="add-baremetal-host-form-submit-btn"
          >
            Create
          </Button>
          <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
            Cancel
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
};

export default AddBareMetalHostForm;
