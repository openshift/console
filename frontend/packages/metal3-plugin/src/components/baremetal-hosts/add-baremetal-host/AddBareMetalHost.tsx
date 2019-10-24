import * as React from 'react';
import * as Yup from 'yup';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { history, resourcePathFromModel, FirehoseResult } from '@console/internal/components/utils';
import { nameValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import { getName } from '@console/shared';
import { createBareMetalHost } from '../../../k8s/requests/bare-metal-host';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import {
  buildBareMetalHostSecret,
  buildBareMetalHostObject,
} from '../../../k8s/objects/bare-metal-host';
import AddBareMetalHostForm from './AddBareMetalHostForm';
import { AddBareMetalHostFormValues } from './types';
import { MAC_REGEX, BMC_ADDRESS_REGEX } from './utils';

const initialValues: AddBareMetalHostFormValues = {
  name: '',
  BMCAddress: '',
  username: '',
  password: '',
  bootMACAddress: '',
  online: true,
  description: '',
};

type AddBareMetalHostProps = {
  namespace: string;
  hosts?: FirehoseResult<BareMetalHostKind[]>;
};

const AddBareMetalHost: React.FC<AddBareMetalHostProps> = ({ namespace, hosts }) => {
  const hostNames = _.flatMap(_.get(hosts, 'data', []), (host) => getName(host));

  const addHostValidationSchema = Yup.object().shape({
    name: Yup.mixed()
      .test(
        'unique-name',
        'Name "${value}" is already taken.', // eslint-disable-line no-template-curly-in-string
        (value) => !hostNames.includes(value),
      )
      .concat(nameValidationSchema),
    BMCAddress: Yup.string()
      .matches(BMC_ADDRESS_REGEX, 'Value provided is not a valid BMC address')
      .required('Required.'),
    username: Yup.string().required('Required.'),
    password: Yup.string().required('Required.'),
    bootMACAddress: Yup.string()
      .matches(MAC_REGEX, 'Value provided is not a valid MAC Address.')
      .required('Required.'),
  });

  const handleSubmit = (
    { name, BMCAddress, username, password, bootMACAddress, online, description },
    actions,
  ) => {
    const secret = buildBareMetalHostSecret(name, namespace, username, password);
    const bareMetalHost = buildBareMetalHostObject(
      name,
      namespace,
      BMCAddress,
      bootMACAddress,
      online,
      description,
    );
    createBareMetalHost(bareMetalHost, secret)
      .then(() => {
        actions.setSubmitting(false);
        history.push(resourcePathFromModel(BareMetalHostModel, name, namespace));
      })
      .catch((error) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: error.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={addHostValidationSchema}
      component={AddBareMetalHostForm}
    />
  );
};

export default AddBareMetalHost;
