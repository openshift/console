import { V2VVMwareModel } from '../../../models';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { V2VVMwareWrappper } from '../../wrapper/v2vvmware/v2vvmware-wrapper';
import { getDefaultSecretName } from './utils/utils';
import { getName, getOwnerReferences } from '@console/shared/src';
import { SecretModel } from '@console/internal/models';
import { PatchBuilder } from '@console/shared/src/k8s';
import { buildOwnerReference } from '../../../utils';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { SecretWrappper } from '../../wrapper/k8s/secret-wrapper';
import { VCENTER_TEMPORARY_LABEL, VCENTER_TYPE_LABEL } from '../../../constants/v2v';

export const createV2VvmwareObjectWithSecret = async (
  {
    url,
    username,
    password,
    namespace,
  }: { url?: string; username?: string; password?: string; namespace?: string },
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
          [VCENTER_TYPE_LABEL]: 'true',
          [VCENTER_TEMPORARY_LABEL]: 'true', // garbage collect and do not list this temporary secret in the dropdown box
        },
      })
      .setValue('username', username)
      .setValue('password', password)
      .setValue('url', url)
      .asResource(),
  );

  const v2vvmware = await k8sCreate(
    V2VVMwareModel,
    new V2VVMwareWrappper()
      .init({
        namespace,
        generateName: `check-${getDefaultSecretName({ url, username })}-`,
        isTemporary: true,
      })
      .setConnection(getName(secret))
      .asResource(),
  );

  if (v2vvmware) {
    await k8sPatch(SecretModel, secret, [
      new PatchBuilder('/metadata/ownerReferences')
        .setListUpdate(
          buildOwnerReference(v2vvmware),
          getOwnerReferences(secret),
          compareOwnerReference,
        )
        .build(),
    ]);
  }

  return v2vvmware;
};
// ATM, Kubernetes does not support deletion of CRs with a gracefulPeriod (delayed deletion).
// The only object with this support are PODs.
// More info: https://github.com/kubernetes/kubernetes/issues/56567
// Workaround: handle garbage collection on our own by:
// - set VCENTER_TEMPORARY_LABEL label to 'true'
// - controller will set deletionTimestamp label with RFC 3339 timestamp
// - controller will remove the object after the timeStamp
// - can be easily extended for delaying the deletionTimestamp (recently not needed, so not implemented)

export const createV2VvmwareObject = async (
  { connectionSecretName, namespace }: { connectionSecretName?: string; namespace?: string },
  { k8sCreate }: EnhancedK8sMethods,
) =>
  k8sCreate(
    V2VVMwareModel,
    new V2VVMwareWrappper()
      .init({ namespace, generateName: `v2vvmware-${connectionSecretName}-`, isTemporary: true })
      .setConnection(connectionSecretName)
      .asResource(),
  );
