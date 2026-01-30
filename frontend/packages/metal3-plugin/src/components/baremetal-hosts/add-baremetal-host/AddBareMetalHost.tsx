import type { FC } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import * as Yup from 'yup';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel, LoadingBox, LoadError } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
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
import type { BareMetalHostKind } from '../../../types';
import { MAC_REGEX, BMC_ADDRESS_REGEX } from '../../../validations/regex';
import { nameValidationSchema } from '../../../validations/validations';
import AddBareMetalHostForm from './AddBareMetalHostForm';
import type { AddBareMetalHostFormValues } from './types';

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
  bootMode: host?.spec?.bootMode || 'UEFI',
});

type AddBareMetalHostProps = {
  namespace: string;
  name?: string;
  enablePowerMgmt: boolean;
};

const AddBareMetalHost: FC<AddBareMetalHostProps> = ({ namespace, name, enablePowerMgmt }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const bmhResource = useMemo<WatchK8sResource>(
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
  const bmhResources = useMemo<WatchK8sResource>(
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
  const secretResource = useMemo<WatchK8sResource>(
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

  const [reload, setReload] = useState<boolean>(false);
  useEffect(() => {
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

  const showUpdated =
    (credentialsName ? !_.isEmpty(initialSecret) : true) &&
    !_.isEmpty(initialHost) &&
    !_.isEqual(prevInitialValues, initialValues);

  const addHostValidationSchema = Yup.lazy(({ enablePowerManagement }) =>
    Yup.object().shape({
      name: Yup.string()
        .test(
          'unique-name',
          t('metal3-plugin~Name "${value}" is already taken.'), // eslint-disable-line no-template-curly-in-string
          (value: string) => !hostNames.includes(value),
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
        navigate(resourcePathFromModel(BareMetalHostModel, values.name, namespace));
      })
      .catch((error) => {
        actions.setStatus({ submitError: error.message });
      });
  };

  const isEditing = !!name;

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={!!name && reload}
      onSubmit={handleSubmit}
      onReset={() => setReload(true)}
      validationSchema={addHostValidationSchema}
      validateOnMount={isEditing}
      initialTouched={
        isEditing
          ? Object.keys(initialValues).reduce((acc, curr) => {
              acc[curr] = true;
              return acc;
            }, {})
          : undefined
      }
    >
      {(props) => (
        <AddBareMetalHostForm {...props} isEditing={isEditing} showUpdated={showUpdated} />
      )}
    </Formik>
  );
};

export default AddBareMetalHost;
