import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExternalLinkWithCopy,
  ResourceLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { DomainMappingModel } from '../../../models';

export type DomainMappingOverviewListProps = {
  title: string;
  domainMappings: K8sResourceKind[];
};

const DomainMappingOverviewList: React.FC<DomainMappingOverviewListProps> = ({
  title,
  domainMappings,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={title} />
      <ul className="list-group">
        {domainMappings?.map((domainMapping) => {
          const {
            metadata: { name, namespace, uid },
            status,
          } = domainMapping;
          return (
            <li key={uid} className="list-group-item">
              <ResourceLink
                kind={referenceForModel(DomainMappingModel)}
                name={name}
                namespace={namespace}
              />
              {status?.url?.length > 0 && (
                <>
                  <span className="pf-v6-u-text-color-subtle">{t('knative-plugin~Location:')}</span>
                  <ExternalLinkWithCopy link={status.url} text={status.url} isInline={false} />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default DomainMappingOverviewList;
