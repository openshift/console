import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { RhUiWarningFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceFilters,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { TableProps } from '@console/internal/components/factory/table';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { Priority, priorityFor } from '../const';
import type { ImageVuln } from '../types';
import {
  getVulnerabilitySource,
  getVulnerabilityType,
  VulnerabilitiesType,
} from './image-vulnerability-utils';

/** Console-only model for column width preferences; not a cluster API resource. */
const ImageVulnerabilityTableModel: K8sModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'ImageVulnerabilityTable',
  id: 'imagevulnerabilitytable',
  plural: 'imagevulnerabilitytables',
  label: 'Image vulnerability',
  labelPlural: 'Image vulnerabilities',
  abbr: 'IV',
};

const TYPE_FILTER_ID = 'vulnerability-type';
const SEVERITY_FILTER_ID = 'vulnerability-severity';

/** `getVulnerabilityType` only ever reports one of these two, so `allVulnerabilities` is omitted. */
const VULNERABILITY_TYPE_OPTIONS = [
  VulnerabilitiesType.appDependency,
  VulnerabilitiesType.baseImage,
].map((value) => ({ value, label: value }));

const SEVERITY_OPTIONS = Object.values(Priority).map((value) => ({ value, label: value }));

type ImageVulnerabilityFilters = ResourceFilters & {
  [TYPE_FILTER_ID]: string[];
  [SEVERITY_FILTER_ID]: string[];
};

const useImageVulnerabilityColumns = (): {
  columns: ConsoleDataViewColumn<ImageVuln>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('container-security');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    ImageVulnerabilityTableModel,
  );
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Name'),
        sort: 'vulnerability.name',
        props: { ...getNameColumnProps(), modifier: 'nowrap' as const },
      },
      {
        id: 'severity',
        resizableProps: getResizableProps('severity'),
        title: t('Severity'),
        // Order by how urgent the severity is rather than alphabetically. `index` counts up from
        // the most severe, so ascending puts Defcon1 first.
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue(
              direction,
              (obj: ImageVuln) => priorityFor(obj.vulnerability.severity).index,
            ),
          ),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'package',
        resizableProps: getResizableProps('package'),
        title: t('Package'),
        sort: 'feature.name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'type',
        resizableProps: getResizableProps('type'),
        title: t('Type'),
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue(direction, (obj: ImageVuln) =>
              getVulnerabilityType(obj.vulnerability),
            ),
          ),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'source',
        resizableProps: getResizableProps('source'),
        title: t('Source'),
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue(direction, (obj: ImageVuln) =>
              getVulnerabilitySource(obj.vulnerability),
            ),
          ),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'currentVersion',
        resizableProps: getResizableProps('currentVersion'),
        title: t('Current version'),
        sort: 'feature.version',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'fixedInVersion',
        resizableProps: getResizableProps('fixedInVersion'),
        title: t('Fixed in version'),
        sort: 'vulnerability.fixedby',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};

export const getImageVulnerabilityDataViewRows: GetDataViewRows<ImageVuln> = (data, columns) =>
  data.map(({ obj: { vulnerability, feature } }) => {
    const rowCells = {
      name: {
        cell: <ExternalLink text={vulnerability.name} href={vulnerability.link} />,
        props: getNameCellProps(vulnerability.name),
      },
      severity: {
        cell: (
          <>
            <RhUiWarningFillIcon color={priorityFor(vulnerability.severity).color.value} />
            &nbsp;{vulnerability.severity}
          </>
        ),
      },
      package: { cell: feature.name },
      type: { cell: getVulnerabilityType(vulnerability) },
      source: { cell: getVulnerabilitySource(vulnerability) },
      currentVersion: { cell: feature.version },
      fixedInVersion: { cell: vulnerability.fixedby || '-' },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const getObjectMetadata = (imageVuln: ImageVuln): ResourceMetadata => ({
  name: imageVuln.vulnerability.name,
});

type ImageVulnerabilitiesTableProps = TableProps & {
  data: ImageVuln[];
};

const ImageVulnerabilitiesTable: FC<ImageVulnerabilitiesTableProps> = (props) => {
  const { t } = useTranslation('container-security');
  const { columns, resetAllColumnWidths } = useImageVulnerabilityColumns();

  const initialFilters = useMemo<ImageVulnerabilityFilters>(
    () => ({ ...initialFiltersDefault, [TYPE_FILTER_ID]: [], [SEVERITY_FILTER_ID]: [] }),
    [],
  );
  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key={TYPE_FILTER_ID}
        filterId={TYPE_FILTER_ID}
        title={t('Type')}
        placeholder={t('Filter by type')}
        options={VULNERABILITY_TYPE_OPTIONS}
      />,
      <DataViewCheckboxFilter
        key={SEVERITY_FILTER_ID}
        filterId={SEVERITY_FILTER_ID}
        title={t('Severity')}
        placeholder={t('Filter by severity')}
        options={SEVERITY_OPTIONS}
      />,
    ],
    [t],
  );
  const matchesAdditionalFilters = useCallback(
    ({ vulnerability }: ImageVuln, filters: ImageVulnerabilityFilters) =>
      (filters[TYPE_FILTER_ID].length === 0 ||
        filters[TYPE_FILTER_ID].includes(getVulnerabilityType(vulnerability))) &&
      (filters[SEVERITY_FILTER_ID].length === 0 ||
        // Normalized so a severity reported in title form matches the Priority value the
        // checkbox carries, and an unrecognized one filters as Unknown, which is how the row
        // already sorts and colours it.
        filters[SEVERITY_FILTER_ID].includes(priorityFor(vulnerability.severity).value)),
    [],
  );

  return (
    <ConsoleDataView<ImageVuln, unknown, ImageVulnerabilityFilters>
      {...props}
      label={t('Image vulnerabilities')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getImageVulnerabilityDataViewRows}
      getObjectMetadata={getObjectMetadata}
      defaultSortColumnId="severity"
      initialFilters={initialFilters}
      additionalFilterNodes={additionalFilterNodes}
      matchesAdditionalFilters={matchesAdditionalFilters}
      hideColumnManagement
      hideLabelFilter
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};

export default ImageVulnerabilitiesTable;
