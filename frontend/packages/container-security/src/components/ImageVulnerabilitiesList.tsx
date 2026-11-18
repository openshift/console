import type { FC } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import type { WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { MultiListPage } from '@console/internal/components/factory/list-page';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { ImageManifestVulnModel } from '../models';
import type { ImageManifestVuln } from '../types';
import ImageVulnerabilitiesTable from './ImageVulnerabilitiesTable';

type ImageVulnerabilitiesListProps = {
  obj: ImageManifestVuln;
};

const ImageVulnerabilitiesList: FC<ImageVulnerabilitiesListProps> = (props) => {
  const { t } = useTranslation('container-security');
  const {
    obj: {
      metadata: { name },
    },
  } = props;
  const { ns: namespace } = useParams();

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
      title={t('Vulnerabilities')}
      // Not sorted here: ConsoleDataView always applies its own sort, so any order set now is
      // discarded. Severity ordering lives on the Severity column instead.
      flatten={(resources: WatchK8sResults<{ imageVulnerabilities: ImageManifestVuln }>) =>
        _.flatten(
          (resources?.imageVulnerabilities?.data?.spec?.features ?? []).map((feature) =>
            (feature?.vulnerabilities ?? []).map((vulnerability) => ({ feature, vulnerability })),
          ),
        )
      }
      namespace={namespace}
      canCreate={false}
      showTitle
      textFilter="vulnerability"
      hideLabelFilter
      ListComponent={ImageVulnerabilitiesTable}
      omitFilterToolbar
    />
  );
};

export default ImageVulnerabilitiesList;
