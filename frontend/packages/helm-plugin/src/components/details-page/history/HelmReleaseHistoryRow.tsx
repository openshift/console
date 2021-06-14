import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { confirmModal } from '@console/internal/components/modals';
import { Timestamp } from '@console/internal/components/utils';
import { Status } from '@console/shared';
import KebabMenu from '@console/shared/src/components/kebab/KebabMenu';
import { HelmRelease } from '../../../types/helm-types';
import { tableColumnClasses } from './HelmReleaseHistoryHeader';

type HelmReleaseHistoryKebabProps = {
  obj: HelmRelease;
};

const confirmModalRollbackHelmRelease = (
  releaseName: string,
  namespace: string,
  revision: number | string,
  t: TFunction,
) => {
  const message = (
    <Trans i18nKey="confirmModalRollbackHelmReleaseKey" ns="helm-plugin">
      Are you sure you want to rollback <strong>{{ releaseName }}</strong> to{' '}
      <strong>Revision {{ revision }}</strong>?
    </Trans>
  );

  const payload = {
    namespace,
    name: releaseName,
    version: revision,
  };

  const executeFn = () => coFetchJSON.patch('/api/helm/release', payload);

  return {
    id: 'helm-rollback-modal-action',
    label: t('helm-plugin~Rollback to Revision {{revision}}', { revision }),
    cta: () => {
      confirmModal({
        title: t('helm-plugin~Rollback'),
        btnText: t('helm-plugin~Rollback'),
        message,
        executeFn,
      });
    },
  };
};

const HelmReleaseHistoryKebab: React.FC<HelmReleaseHistoryKebabProps> = ({ obj }) => {
  const { t } = useTranslation();
  const menuActions = [confirmModalRollbackHelmRelease(obj.name, obj.namespace, obj.version, t)];
  return <KebabMenu actions={menuActions} />;
};

const HelmReleaseHistoryRow: RowFunction = ({ obj, index, key, style }) => (
  <TableRow id={obj.revision} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses.revision}>{obj.version}</TableData>
    <TableData className={tableColumnClasses.updated}>
      <Timestamp timestamp={obj.info.last_deployed} />
    </TableData>
    <TableData className={tableColumnClasses.status}>
      <Status status={_.capitalize(obj.info.status)} />
    </TableData>
    <TableData className={tableColumnClasses.chartName}>{obj.chart.metadata.name}</TableData>
    <TableData className={tableColumnClasses.chartVersion}>{obj.chart.metadata.version}</TableData>
    <TableData className={tableColumnClasses.appVersion}>{obj.chart.metadata.appVersion}</TableData>
    <TableData className={tableColumnClasses.description}>{obj.info.description}</TableData>
    <TableData className={tableColumnClasses.kebab}>
      <HelmReleaseHistoryKebab obj={obj} />
    </TableData>
  </TableRow>
);

export default HelmReleaseHistoryRow;
