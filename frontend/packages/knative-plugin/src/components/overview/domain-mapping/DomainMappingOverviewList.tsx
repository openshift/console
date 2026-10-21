import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ExternalLinkWithCopy,
  ResourceLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { DomainMappingModel } from '../../../models';

export type DomainMappingOverviewListProps = {
  title: string;
  domainMappings: K8sResourceKind[];
};

const DomainMappingOverviewList: FC<DomainMappingOverviewListProps> = ({
  title,
  domainMappings,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={title} />
      <List isPlain isBordered>
        {domainMappings?.map((domainMapping) => {
          const {
            metadata: { name, namespace, uid },
            status,
          } = domainMapping;
          return (
            <ListItem key={uid}>
              <ResourceLink
                kind={referenceForModel(DomainMappingModel)}
                name={name}
                namespace={namespace}
              />
              {status?.url?.length > 0 && (
                <>
                  <span className="pf-v6-u-text-color-subtle">{t('knative-plugin~Location:')}</span>
                  <ExternalLinkWithCopy href={status.url} text={status.url} displayBlock />
                </>
              )}
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

export default DomainMappingOverviewList;
