import * as React from 'react';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

import { StatusIconAndText } from '@console/shared';
import { ChartPie, ChartThemeColor } from '@patternfly/react-charts';
import {
  ExpandableSection,
  Popover,
  PopoverPosition,
  Button,
  List,
  ListItem,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { StoragePoolKind } from 'packages/ceph-storage-plugin/src/types';
import { MirroringCardBody } from './mirroring-card-body';
import { MirroringCardItem } from './mirroring-card-item';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { healthStateMapping, ImageStateLegendMap } from './states';
import { twelveHoursdateTimeNoYear, calcPercentage } from '../../../utils/common';

import './mirroring-card.scss';

const MirroringImageStatePopover: React.FC<MirroringImageStatePopoverProps> = ({ t }) => {
  return (
    <Popover
      maxWidth="32rem"
      position={PopoverPosition.left}
      aria-label={t('ceph-storage-plugin~Image states info')}
      bodyContent={
        <List isPlain>
          <ListItem>
            <strong> {t('ceph-storage-plugin~What does each state mean?')}</strong>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Starting replay:</strong> Initiating image (PV) replication process.{' '}
            </Trans>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Replaying:</strong> Image (PV) replication is ongoing or idle between
              clusters.{' '}
            </Trans>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Stopping replay:</strong> Image (PV) replication process is shutting down.{' '}
            </Trans>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Stopped:</strong> Image (PV) replication process has shut down.{' '}
            </Trans>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Error:</strong> Image (PV) replication process stopped due to an error.{' '}
            </Trans>
          </ListItem>
          <ListItem>
            <Trans t={t} ns="ceph-storage-plugin">
              {' '}
              <strong>Unknown:</strong> Unable to determine image (PV) state due to an error. Check
              your network connection and remote cluster mirroring daemon.{' '}
            </Trans>
          </ListItem>
        </List>
      }
    >
      <Button
        aria-label={t('ceph-storage-plugin~image states info')}
        variant="link"
        isInline
        className="odf-block-pool-mirroring-help"
      >
        <OutlinedQuestionCircleIcon className="odf-block-pool-mirroring-help__icon" />
        What does each state mean?
      </Button>
    </Popover>
  );
};

const MirroringImageHealthChart: React.FC<MirroringImageHealthChartProps> = ({ t, poolObj }) => {
  const states: any = poolObj.status?.mirroringStatus?.summary?.states ?? {};
  const totalImageCount = Object.keys(states).reduce((sum, state) => sum + states[state], 0);

  if (totalImageCount > 0) {
    const data = Object.keys(states).map((state) => ({
      x: ImageStateLegendMap(t)[state],
      y: calcPercentage(states[state], totalImageCount),
    }));
    const legendData = Object.keys(states).map((state) => ({
      name: `${ImageStateLegendMap(t)[state]}: ${calcPercentage(states[state], totalImageCount)}`,
    }));

    return (
      <div style={{ maxHeight: '210px', maxWidth: '300px' }}>
        <ChartPie
          ariaTitle={t('ceph-storage-plugin~Image States')}
          constrainToVisibleArea
          data={data}
          labels={({ datum }) => `${datum.x}: ${datum.y}`}
          legendData={legendData}
          legendOrientation="vertical"
          legendPosition="right"
          height={210}
          width={300}
          padding={{
            right: 160,
          }}
          themeColor={ChartThemeColor.multi}
        />
      </div>
    );
  }
  return <></>;
};

export const MirroringCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);

  const mirroringStatus: boolean = obj.spec?.mirroring?.enabled;
  const mirroringImageHealth: string = obj.status?.mirroringStatus?.summary?.image_health;
  const lastChecked: string = obj.status?.mirroringStatus?.lastChecked;
  const formatedDateTime = lastChecked
    ? twelveHoursdateTimeNoYear.format(new Date(lastChecked))
    : '-';

  return (
    <DashboardCard data-test-id="mirroring-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Mirroring')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <MirroringCardBody>
          <MirroringCardItem isLoading={!obj} title={t('ceph-storage-plugin~Mirroring status')}>
            {mirroringStatus ? t('ceph-storage-plugin~Enabled') : t('ceph-storage-plugin~Disabled')}
          </MirroringCardItem>
          {mirroringStatus && (
            <>
              <MirroringCardItem
                isLoading={!obj}
                title={t('ceph-storage-plugin~Overall image health')}
              >
                <StatusIconAndText
                  title={mirroringImageHealth}
                  icon={healthStateMapping[mirroringImageHealth]?.icon}
                />
              </MirroringCardItem>
              <MirroringCardItem>
                <ExpandableSection toggleText={t('ceph-storage-plugin~Show image states')}>
                  <MirroringImageHealthChart t={t} poolObj={obj} />
                </ExpandableSection>
              </MirroringCardItem>
              <MirroringCardItem>
                <MirroringImageStatePopover t={t} />
              </MirroringCardItem>
              <MirroringCardItem isLoading={!obj} title={t('ceph-storage-plugin~Last checked')}>
                {formatedDateTime}
              </MirroringCardItem>
            </>
          )}
        </MirroringCardBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type MirroringImageStatePopoverProps = {
  t: TFunction;
};

type MirroringImageHealthChartProps = {
  t: TFunction;
  poolObj: StoragePoolKind;
};
