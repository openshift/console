import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { ConsoleEmptyState } from '@console/internal/components/utils';
import { Feature, Vulnerability } from '../types';
import { getVulnerabilitySource, getVulnerabilityType } from './image-vulnerability-utils';
import ImageVulnerabilityRow, {
  imageVulnerabilitiesTableColumnClasses,
} from './ImageVulnerabilityRow';

type ImageVulnerabilitiesTableProps = {
  features: Feature[];
};

const getRowProps = (vulnerability: Vulnerability) => ({
  id: vulnerability.name,
});

const ImageVulnerabilitiesTable: React.FC<ImageVulnerabilitiesTableProps> = (props) => {
  const { t } = useTranslation();
  const EmptyMsg = () => (
    <ConsoleEmptyState title={t('container-security~No Image vulnerabilities found')} />
  );
  const ImageVulnerabilitiesTableHeader = () => [
    {
      title: t('container-security~Name'),
      transforms: [sortable],
      sortField: 'vulnerability.name',
      props: { className: imageVulnerabilitiesTableColumnClasses[0] },
    },
    {
      title: t('container-security~Severity'),
      transforms: [sortable],
      sortField: 'vulnerability.severity',
      props: { className: imageVulnerabilitiesTableColumnClasses[1] },
    },
    {
      title: t('container-security~Package'),
      transforms: [sortable],
      sortField: 'feature.name',
      props: { className: imageVulnerabilitiesTableColumnClasses[2] },
    },
    {
      title: t('container-security~Type'),
      transforms: [sortable],
      sortFunc: 'vulnerabilityType',
      props: { className: imageVulnerabilitiesTableColumnClasses[3] },
    },
    {
      title: t('container-security~Source'),
      transforms: [sortable],
      sortFunc: 'vulnerabilitySource',
      props: { className: imageVulnerabilitiesTableColumnClasses[4] },
    },
    {
      title: t('container-security~Current version'),
      transforms: [sortable],
      sortField: 'feature.version',
      props: { className: imageVulnerabilitiesTableColumnClasses[3] },
    },
    {
      title: t('container-security~Fixed in version'),
      transforms: [sortable],
      sortField: 'vulnerability.fixedby',
      props: { className: imageVulnerabilitiesTableColumnClasses[4] },
    },
  ];
  return (
    <Table
      {...props}
      customSorts={{
        vulnerabilityType: (obj) => getVulnerabilityType(obj.vulnerability),
        vulnerabilitySource: (obj) => getVulnerabilitySource(obj.vulnerability),
      }}
      aria-label={t('container-security~Vulnerabilities')}
      Header={ImageVulnerabilitiesTableHeader}
      Row={ImageVulnerabilityRow}
      EmptyMsg={EmptyMsg}
      virtualize
      getRowProps={getRowProps}
    />
  );
};

export default ImageVulnerabilitiesTable;
