import type { DataViewTd } from '@patternfly/react-data-view';
import type { TdProps } from '@patternfly/react-table';
import { Status, RadioButtonField, DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';

export const getRevisionRows = (releaseHistory: HelmRelease[]): DataViewTd[][] => {
  return releaseHistory.map((revision) => {
    return [
      {
        cell: <RadioButtonField value={revision.version} name="revision" />,
        props: {
          isStickyColumn: true,
          stickyMinWidth: '50px',
        } as TdProps,
      },
      {
        cell: revision.version,
      },
      {
        cell: <Timestamp timestamp={revision.info.last_deployed} />,
      },
      {
        cell: (
          <Status
            status={releaseStatus(revision.info.status)}
            title={HelmReleaseStatusLabels[revision.info.status]}
          />
        ),
      },
      {
        cell: revision.chart.metadata.name,
      },
      {
        cell: revision.chart.metadata.version,
      },
      {
        cell: revision.chart.metadata.appVersion || DASH,
      },
      {
        cell: revision.info.description,
      },
    ];
  });
};

export default getRevisionRows;
