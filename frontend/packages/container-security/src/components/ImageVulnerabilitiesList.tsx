import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResourcesResult } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Priority, priorityFor } from '../const';
import { ImageManifestVulnModel } from '../models';
import { Feature, ImageManifestVuln, Vulnerability } from '../types';
import { getVulnerabilityType, VulnerabilitiesType } from './image-vulnerability-utils';
import ImageVulnerabilitiesTable from './ImageVulnerabilitiesTable';

type ImageVulnerabilitiesListProps = {
  obj: ImageManifestVuln;
};

type ImageVuln = {
  feature: Feature;
  vulnerability: Vulnerability;
};

const ImageVulnerabilitiesList: React.FC<ImageVulnerabilitiesListProps> = (props) => {
  const { t } = useTranslation();
  const {
    obj: {
      metadata: { name },
    },
  } = props;
  const { ns: namespace } = useParams();

  const imageVulnerabilitiesRowFilters: RowFilter<ImageVuln>[] = [
    {
      filterGroupName: t('container-security~Type'),
      items: [
        { id: VulnerabilitiesType.appDependency, title: VulnerabilitiesType.appDependency },
        { id: VulnerabilitiesType.baseImage, title: VulnerabilitiesType.baseImage },
      ],
      type: 'vulnerability-type',
      reducer: (v) => getVulnerabilityType(v.vulnerability),
      filter: (filter, vuln) =>
        filter.selected?.includes(getVulnerabilityType(vuln.vulnerability)) ||
        _.isEmpty(filter.selected),
    },
    {
      filterGroupName: t('container-security~Severity'),
      items: [
        { id: Priority.Defcon1, title: Priority.Defcon1 },
        { id: Priority.Critical, title: Priority.Critical },
        { id: Priority.High, title: Priority.High },
        { id: Priority.Medium, title: Priority.Medium },
        { id: Priority.Low, title: Priority.Low },
        { id: Priority.Negligible, title: Priority.Negligible },
        { id: Priority.Unknown, title: Priority.Unknown },
      ],
      type: 'vulnerability-severity',
      reducer: (v) => v.vulnerability.severity,
      filter: (filter, vuln) =>
        filter.selected?.includes(vuln.vulnerability.severity) || _.isEmpty(filter.selected),
    },
  ];

  return (
    <MultiListPage
      {...props}
      resources={[
        {
          kind: referenceForModel(ImageManifestVulnModel),
          namespaced: true,
          namespace,
          name,
          isList: false,
          prop: 'imageVulnerabilities',
          optional: true,
        },
      ]}
      title={t('container-security~Vulnerabilities')}
      flatten={(
        resources: FirehoseResourcesResult<{ imageVulnerabilities: ImageManifestVuln }>,
      ) => {
        return _.sortBy(
          _.flatten(
            (resources?.imageVulnerabilities?.data?.spec?.features ?? []).map((feature) =>
              (feature?.vulnerabilities ?? []).map((vulnerability) => ({ feature, vulnerability })),
            ),
          ),
          (v: ImageVuln) => priorityFor(v?.vulnerability?.severity).index,
        );
      }}
      namespace={namespace}
      canCreate={false}
      showTitle
      textFilter="vulnerability"
      rowFilters={imageVulnerabilitiesRowFilters}
      hideLabelFilter
      ListComponent={ImageVulnerabilitiesTable}
    />
  );
};

export default ImageVulnerabilitiesList;
