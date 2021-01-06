import { Map as ImmutableMap } from 'immutable';

import { GroupVersionKind } from '../../module/k8s';
import { referenceForModel } from '../../module/k8s'
import * as k8sModels from '..';

export const hyperCloudTemplates = ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
    .setIn(
        [referenceForModel(k8sModels.RegistryModel), 'default'],
        `
        apiVersion: tmax.io/v1
        kind: Registry
        metadata:
          name: tmax-registry
          namespace: reg-test
        spec:
          image: registry:2.7.1
          description: test
          loginId: tmax
          loginPassword: tmax123
          notary:
            enabled: true
            serviceType: LoadBalancer
            persistentVolumeClaim:
              create:
                accessModes: [ReadWriteOnce]
                storageSize: 10Gi
                storageClassName: csi-cephfs-sc
                volumeMode: Filesystem
                deleteWithPvc: true
          service:
            serviceType: LoadBalancer
          persistentVolumeClaim:
            mountPath: /var/lib/registry
            create:
              accessModes: [ReadWriteOnce]
              storageSize: 10Gi
              storageClassName: csi-cephfs-sc
              volumeMode: Filesystem
              deleteWithPvc: true
        `,
    )
    .setIn(
        [referenceForModel(k8sModels.ImageSignerModel), 'default'],
        `
        apiVersion: tmax.io/v1
        kind: ImageSigner
        metadata:
          name: signer-a
        spec:
          # Add fields here
          description: for develope
          email: signer@tmax.co.kr
          name: signer-name
          phone: 010-1234-5678
          team: ck1-2
        
        `,
    )
    .setIn(
        [referenceForModel(k8sModels.ImageSignRequestModel), 'default'],
        `
        apiVersion: tmax.io/v1
        kind: ImageSignRequest
        metadata:
        name: image-sign-request-a
        namespace: reg-test
        spec:
        image: <registry>/<image>:<tag> # 172.22.11.13:443/alpine:3
        registryLogin:
            certSecretName: hpcd-registry-rootca
            dcjSecretName: hpcd-registry-<registry_name> # hpcd-registry-tmax-registry
        signer: signer-a
        `,
    );

