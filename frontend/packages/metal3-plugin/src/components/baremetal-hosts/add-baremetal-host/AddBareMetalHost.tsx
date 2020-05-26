import * as React from 'react';
import * as Yup from 'yup';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { history, resourcePathFromModel, FirehoseResult } from '@console/internal/components/utils';
import { nameValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import { getName } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createBareMetalHost, updateBareMetalHost } from '../../../k8s/requests/bare-metal-host';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import {
  getHostBMCAddress,
  getHostBootMACAddress,
  getHostDisableCertificateVerification,
  getHostDescription,
  isHostOnline,
} from '../../../selectors';
import { getSecretPassword, getSecretUsername } from '../../../selectors/secret';
import { getLoadedData } from '../../../utils';
import { usePrevious } from '../../../hooks';
import AddBareMetalHostForm from './AddBareMetalHostForm';
import { AddBareMetalHostFormValues } from './types';
import { MAC_REGEX, BMC_ADDRESS_REGEX } from './utils';

const getInitialValues = (
  host: BareMetalHostKind,
  secret: K8sResourceKind,
): AddBareMetalHostFormValues => ({
  name: getName(host) || '',
  BMCAddress: getHostBMCAddress(host) || '',
  username: getSecretUsername(secret) || '',
  password: getSecretPassword(secret) || '',
  disableCertificateVerification: getHostDisableCertificateVerification(host) || false,
  bootMACAddress: getHostBootMACAddress(host) || '',
  online: isHostOnline(host) || true,
  description: getHostDescription(host) || '',
});

type AddBareMetalHostProps = {
  namespace: string;
  isEditing: boolean;
  loaded?: boolean;
  hosts?: FirehoseResult<BareMetalHostKind[]>;
  host?: FirehoseResult<BareMetalHostKind>;
  secret?: FirehoseResult<K8sResourceKind>;
};

const AddBareMetalHost: React.FC<AddBareMetalHostProps> = ({
  namespace,
  isEditing,
  hosts,
  host: resultHost,
  secret: resultSecret,
}) => {
  const [reload, setReload] = React.useState<boolean>(false);
  const hostNames = _.flatMap(getLoadedData(hosts, []), (host) => getName(host));
  const initialHost = getLoadedData(resultHost);
  const initialSecret = getLoadedData(resultSecret);
  const prevInitialHost = usePrevious(initialHost);
  const prevInitialSecret = usePrevious(initialSecret);

  const initialValues = getInitialValues(initialHost, initialSecret);
  const prevInitialValues = getInitialValues(prevInitialHost, prevInitialSecret);

  React.useEffect(() => {
    if (reload) {
      setReload(false);
    }
  }, [reload, setReload]);

  const showUpdated =
    isEditing &&
    prevInitialHost &&
    prevInitialSecret &&
    !_.isEqual(prevInitialValues, initialValues);

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

  const handleSubmit = (values, actions) => {
    const opts = { ...values, namespace };
    const promise = isEditing
      ? updateBareMetalHost(initialHost, initialSecret, opts)
      : createBareMetalHost(opts);

    promise
      .then(() => {
        actions.setSubmitting(false);
        history.push(resourcePathFromModel(BareMetalHostModel, values.name, namespace));
      })
      .catch((error) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: error.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={isEditing && (reload || !prevInitialHost || !prevInitialSecret)}
      onSubmit={handleSubmit}
      onReset={() => setReload(true)}
      validationSchema={addHostValidationSchema}
    >
      {(props) => (
        <AddBareMetalHostForm {...props} isEditing={isEditing} showUpdated={showUpdated} />
      )}
    </Formik>
  );
};

export default AddBareMetalHost;
