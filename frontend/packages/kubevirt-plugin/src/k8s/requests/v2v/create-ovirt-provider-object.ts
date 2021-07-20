import { SecretModel } from '@console/internal/models';
import { OVIRT_TYPE_LABEL, V2V_TEMPORARY_LABEL } from '../../../constants/v2v';
import { OVirtProviderModel } from '../../../models';
import { getName, getOwnerReferences } from '../../../selectors';
import { buildOwnerReference, compareOwnerReference } from '../../../utils';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { PatchBuilder } from '../../helpers/patch';
import { SecretWrappper } from '../../wrapper/k8s/secret-wrapper';
import { OVirtProviderWrappper } from '../../wrapper/ovirt-provider/ovirt-provider-wrapper';
import { getDefaultSecretName } from './utils/utils';

export const createOvirtProviderObjectWithSecret = async (
  {
    url,
    username,
    password,
    caCertificate,
    namespace,
  }: {
    url?: string;
    username?: string;
    password?: string;
    namespace?: string;
    caCertificate?: string;
  },
  { k8sCreate, k8sPatch }: EnhancedK8sMethods,
) => {
  const secretName = `${getDefaultSecretName({ url, username })}-`;
  const secret = await k8sCreate(
    SecretModel,
    new SecretWrappper()
      .init({
        generateName: secretName,
        namespace,
        labels: {
          [OVIRT_TYPE_LABEL]: 'true',
          [V2V_TEMPORARY_LABEL]: 'true', // garbage collect and do not list this temporary secret in the dropdown box
        },
      })
      .setJSONValue('ovirt', { username, password, apiUrl: url, caCert: caCertificate })
      .asResource(),
  );

  const ovirtProvider = await k8sCreate(
    OVirtProviderModel,
    new OVirtProviderWrappper()
      .init({
        namespace,
        generateName: `ovirt-provider-${getDefaultSecretName({ url, username })}-`,
        isTemporary: true,
      })
      .setConnection(getName(secret))
      .asResource(),
  );

  if (ovirtProvider) {
    await k8sPatch(SecretModel, secret, [
      new PatchBuilder('/metadata/ownerReferences')
        .setListUpdate(
          buildOwnerReference(ovirtProvider),
          getOwnerReferences(secret),
          compareOwnerReference,
        )
        .build(),
    ]);
  }

  return ovirtProvider;
};

export const createOvirtProviderObject = async (
  { connectionSecretName, namespace }: { connectionSecretName?: string; namespace?: string },
  { k8sCreate }: EnhancedK8sMethods,
) =>
  k8sCreate(
    OVirtProviderModel,
    new OVirtProviderWrappper()
      .init({
        namespace,
        generateName: `ovirt-provider-${connectionSecretName}-`,
        isTemporary: true,
      })
      .setConnection(connectionSecretName)
      .asResource(),
  );
