import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { LazyActionMenu } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, Kebab, ExternalLink } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';

const helmChartRepositoryReference = referenceForModel(HelmChartRepositoryModel);
const projectHelmChartRepositoryReference = referenceForModel(ProjectHelmChartRepositoryModel);

const tableColumnClasses = [
  '', // Name
  '', // Display Name
  '', // Namespace
  '', // Disabled
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // Repo URL
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // Created
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
          <ExternalLink
            href={obj.spec.connectionConfig.url}
            text={obj.spec.connectionConfig.url}
            additionalClassName="co-external-link--block"
          />
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
