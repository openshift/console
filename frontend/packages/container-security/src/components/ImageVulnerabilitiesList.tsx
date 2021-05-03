import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { MultiListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { ImageManifestVulnModel } from '../models';
import { Priority, priorityFor } from '../const';
import { Feature, ImageManifestVuln, Vulnerability } from '../types';
import ImageVulnerabilitiesTable from './ImageVulnerabilitiesTable';
import { getVulnerabilityType, VulnerabilitiesType } from './image-vulnerability-utils';

type ImageVulnerabilitiesListProps = {
  match?: match<{ ns?: string }>;
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
    match: {
      params: { ns: namespace },
    },
  } = props;

  const imageVulnerabilitiesRowFilters: RowFilter[] = [
    {
      filterGroupName: t('container-security~Type'),
      items: [
        { id: VulnerabilitiesType.appDependency, title: VulnerabilitiesType.appDependency },
        { id: VulnerabilitiesType.baseImage, title: VulnerabilitiesType.baseImage },
      ],
      type: 'vulnerability-type',
      reducer: (v) => getVulnerabilityType(v.vulnerability),
      filter: (filter, vuln) =>
        filter.selected.has(getVulnerabilityType(vuln.vulnerability)) || _.isEmpty(filter.selected),
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
        filter.selected.has(vuln.vulnerability.severity) || _.isEmpty(filter.selected),
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
      flatten={(resources) => {
        return _.sortBy(
          _.flatten(
            resources?.imageVulnerabilities?.data?.spec.features.map((feature) =>
              feature.vulnerabilities.map((vulnerability) => ({ feature, vulnerability })),
            ),
          ),
          (v: ImageVuln) => priorityFor(v.vulnerability.severity).index,
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
