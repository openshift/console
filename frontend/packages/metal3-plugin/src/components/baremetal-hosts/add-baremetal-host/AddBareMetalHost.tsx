import * as React from 'react';
import * as Yup from 'yup';
import * as _ from 'lodash';
import { Formik, FormikHelpers } from 'formik';
import {
  history,
  resourcePathFromModel,
  LoadingBox,
  LoadError,
} from '@console/internal/components/utils';
import { nameValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import { getName } from '@console/shared/src';
import { usePrevious } from '@console/shared/src/hooks/previous';
import { referenceForModel, SecretKind } from '@console/internal/module/k8s';
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
import AddBareMetalHostForm from './AddBareMetalHostForm';
import { AddBareMetalHostFormValues } from './types';
import { MAC_REGEX, BMC_ADDRESS_REGEX } from './utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';

const getInitialValues = (
  host: BareMetalHostKind,
  secret: SecretKind,
  isEditing: boolean,
  enablePowerMgmt: boolean,
): AddBareMetalHostFormValues => ({
  name: getName(host) || '',
  BMCAddress: getHostBMCAddress(host) || '',
  username: getSecretUsername(secret) || '',
  password: getSecretPassword(secret) || '',
  disableCertificateVerification: getHostDisableCertificateVerification(host) || false,
  bootMACAddress: getHostBootMACAddress(host) || '',
  online: isHostOnline(host) || true,
  description: getHostDescription(host) || '',
  enablePowerManagement: isEditing
    ? !!host?.spec?.bmc?.address || !!host?.spec?.bmc?.credentialsName || enablePowerMgmt
    : true,
});

type AddBareMetalHostProps = {
  namespace: string;
  name?: string;
  enablePowerMgmt: boolean;
};

const AddBareMetalHost: React.FC<AddBareMetalHostProps> = ({
  namespace,
  name,
  enablePowerMgmt,
}) => {
  const bmhResource = React.useMemo<WatchK8sResource>(
    () =>
      name
        ? {
            kind: referenceForModel(BareMetalHostModel),
            namespace,
            name,
          }
        : undefined,
    [name, namespace],
  );
  const bmhResources = React.useMemo<WatchK8sResource>(
    () =>
      !name
        ? {
            kind: referenceForModel(BareMetalHostModel),
            namespace,
            isList: true,
          }
        : undefined,
    [name, namespace],
  );
  const [host, hostLoaded, hostError] = useK8sWatchResource<BareMetalHostKind>(bmhResource);
  const [hosts, hostsLoaded, hostsError] = useK8sWatchResource<BareMetalHostKind[]>(bmhResources);

  const credentialsName = host?.spec?.bmc?.credentialsName;
  const secretResource = React.useMemo<WatchK8sResource>(
    () =>
      credentialsName
        ? {
            kind: SecretModel.kind,
            namespace,
            name: credentialsName,
          }
        : undefined,
    [credentialsName, namespace],
  );
  const [secret, secretLoaded, secretError] = useK8sWatchResource<SecretKind>(secretResource);

  const [reload, setReload] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (reload) {
      setReload(false);
    }
  }, [reload, setReload]);

  const initialHost = usePrevious<BareMetalHostKind>(host, [hostLoaded, reload]);
  const initialSecret = usePrevious<SecretKind>(secret, [secretLoaded, reload]);

  if (name ? !hostLoaded || (secretResource ? !secretLoaded : false) : !hostsLoaded) {
    return <LoadingBox />;
  }

  if (hostError || secretError || hostsError) {
    return <LoadError label="resources" />;
  }

  const hostNames = !name ? hosts.map(getName) : [];

  const initialValues = getInitialValues(host, secret, !!name, enablePowerMgmt);
  const prevInitialValues = getInitialValues(initialHost, initialSecret, !!name, enablePowerMgmt);

  const showUpdated = !_.isEmpty(initialHost) && !_.isEqual(prevInitialValues, initialValues);

  const addHostValidationSchema = Yup.lazy(({ enablePowerManagement }) =>
    Yup.object().shape({
      name: Yup.mixed()
        .test(
          'unique-name',
          'Name "${value}" is already taken.', // eslint-disable-line no-template-curly-in-string
          (value) => !hostNames.includes(value),
        )
        .concat(nameValidationSchema),
      BMCAddress: enablePowerManagement
        ? Yup.string()
            .matches(BMC_ADDRESS_REGEX, 'Value provided is not a valid BMC address')
            .required('Required.')
        : undefined,
      username: enablePowerManagement ? Yup.string().required('Required.') : undefined,
      password: enablePowerManagement ? Yup.string().required('Required.') : undefined,
      bootMACAddress: Yup.string()
        .matches(MAC_REGEX, 'Value provided is not a valid MAC Address.')
        .required('Required.'),
    }),
  );

  const handleSubmit = (
    values: AddBareMetalHostFormValues,
    actions: FormikHelpers<AddBareMetalHostFormValues>,
  ) => {
    const opts = { ...values, namespace };
    const promise = name
      ? updateBareMetalHost(
          _.isEmpty(initialHost) ? host : initialHost,
          _.isEmpty(initialSecret) ? secret : initialSecret,
          opts,
        )
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
      enableReinitialize={!!name && reload}
      onSubmit={handleSubmit}
      onReset={() => setReload(true)}
      validationSchema={addHostValidationSchema}
    >
      {(props) => <AddBareMetalHostForm {...props} isEditing={!!name} showUpdated={showUpdated} />}
    </Formik>
  );
};

export default AddBareMetalHost;
