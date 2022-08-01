import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import { Kebab } from '@console/internal/components/utils';

const tableColumnClasses = [
  '', // Name
  '', // Display Name
  '', // Namespace
  '', // Disabled
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // Repo URL
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // Created
  Kebab.columnClass,
];

const RepositoriesHeader = (t: TFunction) => () => {
  return [
    {
      title: t('helm-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('helm-plugin~Display Name'),
      sortField: 'spec.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('helm-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('helm-plugin~Disabled'),
      sortField: 'spec.disabled',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('helm-plugin~Repo URL'),
      sortField: 'spec.connectionConfig.url',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('helm-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default RepositoriesHeader;
