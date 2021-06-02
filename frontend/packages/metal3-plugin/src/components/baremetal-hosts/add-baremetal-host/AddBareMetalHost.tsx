import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import {
  history,
  resourcePathFromModel,
  LoadingBox,
  LoadError,
} from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { referenceForModel, SecretKind } from '@console/internal/module/k8s';
import { getName, nameValidationSchema } from '@console/shared';
import { usePrevious } from '@console/shared/src/hooks/previous';
import { createBareMetalHost, updateBareMetalHost } from '../../../k8s/requests/bare-metal-host';
import { BareMetalHostModel } from '../../../models';
import {
  getHostBMCAddress,
  getHostBootMACAddress,
  getHostDisableCertificateVerification,
  getHostDescription,
  isHostOnline,
} from '../../../selectors';
import { getSecretPassword, getSecretUsername } from '../../../selectors/secret';
import { BareMetalHostKind } from '../../../types';
import AddBareMetalHostForm from './AddBareMetalHostForm';
import { AddBareMetalHostFormValues } from './types';
import { MAC_REGEX, BMC_ADDRESS_REGEX } from './utils';

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
  const { t } = useTranslation();
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
    return <LoadError label={t('metal3-plugin~resources')} />;
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
          t('metal3-plugin~Name "${value}" is already taken.'), // eslint-disable-line no-template-curly-in-string
          (value) => !hostNames.includes(value),
        )
        .concat(nameValidationSchema(t)),
      BMCAddress: enablePowerManagement
        ? Yup.string()
            .matches(
              BMC_ADDRESS_REGEX,
              t('metal3-plugin~Value provided is not a valid BMC address'),
            )
            .required(t('metal3-plugin~Required.'))
        : undefined,
      username: enablePowerManagement
        ? Yup.string().required(t('metal3-plugin~Required.'))
        : undefined,
      password: enablePowerManagement
        ? Yup.string().required(t('metal3-plugin~Required.'))
        : undefined,
      bootMACAddress: Yup.string()
        .matches(MAC_REGEX, t('metal3-plugin~Value provided is not a valid MAC Address.'))
        .required(t('metal3-plugin~Required.')),
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

    return promise
      .then(() => {
        history.push(resourcePathFromModel(BareMetalHostModel, values.name, namespace));
      })
      .catch((error) => {
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
