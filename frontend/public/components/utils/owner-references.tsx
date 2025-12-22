import type { FC } from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, OwnerReference, referenceForOwnerRef } from '../../module/k8s';
import { ResourceLink } from './resource-link';

export const OwnerReferences: FC<OwnerReferencesProps> = ({ resource }) => {
  const { t } = useTranslation();
  const owners = (_.get(resource.metadata, 'ownerReferences') || []).map((o: OwnerReference) => (
    <ResourceLink
      key={o.uid}
      kind={referenceForOwnerRef(o)}
      name={o.name}
      namespace={resource.metadata.namespace}
    />
  ));
  return owners.length ? (
    <>{owners}</>
  ) : (
    <span className="pf-v6-u-text-color-subtle">{t('public~No owner')}</span>
  );
};

type OwnerReferencesProps = {
  resource: K8sResourceKind;
};

OwnerReferences.displayName = 'OwnerReferences';
