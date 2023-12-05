import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { resourcePath } from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { referenceForModel } from '@console/internal/module/k8s';
import { BuildRunModel, BuildRunModelV1Alpha1 } from '../../models';
import { BuildRun } from '../../types';
import { isV1Alpha1Resource } from '../../utils';
import BuildRunStatus from '../buildrun-status/BuildRunStatus';

import './BuildRunItem.scss';

type BuildRunItemProps = {
  buildRun: BuildRun;
};

const BuildRunItem: React.FC<BuildRunItemProps> = ({ buildRun }) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace, creationTimestamp },
    status,
  } = buildRun;
  const buildRunModel = isV1Alpha1Resource(buildRun) ? BuildRunModelV1Alpha1 : BuildRunModel;
  const path = resourcePath(referenceForModel(buildRunModel), name, namespace);
  const lastUpdated = status
    ? status.completionTime || status.startTime || creationTimestamp
    : creationTimestamp;

  return (
    <li className="so-build-run-item list-group-item">
      <Grid hasGutter>
        <GridItem span={6}>
          <div>
            <Link to={`${path}`}>{name}</Link>
            {lastUpdated && (
              <>
                {' '}
                <span className="so-build-run-item__time text-muted">({fromNow(lastUpdated)})</span>
              </>
            )}
          </div>
        </GridItem>
        <GridItem span={3}>
          <BuildRunStatus buildRun={buildRun} />
        </GridItem>
        <GridItem span={3} className="text-right">
          <Link to={`${path}/logs`}>{t('shipwright-plugin~View logs')}</Link>
        </GridItem>
      </Grid>
    </li>
  );
};

export default BuildRunItem;
