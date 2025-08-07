import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { LazyActionMenu } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ResourceLink, Kebab } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';

const helmChartRepositoryReference = referenceForModel(HelmChartRepositoryModel);
const projectHelmChartRepositoryReference = referenceForModel(ProjectHelmChartRepositoryModel);

const tableColumnClasses = [
  '', // Name
  '', // Display Name
  '', // Namespace
  '', // Disabled
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // Repo URL
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // Created
  Kebab.columnClass,
];

const RepositoriesRow: React.FC<RowFunctionArgs> = ({ obj }) => {
  const { t } = useTranslation();
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={
            obj.kind === HelmChartRepositoryModel.kind
              ? helmChartRepositoryReference
              : projectHelmChartRepositoryReference
          }
          name={obj.metadata.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        {obj.spec?.name ? obj.spec.name : '-'}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('helm-plugin~All Namespaces')
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {obj.spec?.disabled ? t('helm-plugin~True') : t('helm-plugin~False')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.spec?.connectionConfig?.url ? (
          <ExternalLinkButton variant="link" href={obj.spec.connectionConfig.url}>
            {obj.spec.connectionConfig.url}
          </ExternalLinkButton>
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={Kebab.columnClass}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default RepositoriesRow;
