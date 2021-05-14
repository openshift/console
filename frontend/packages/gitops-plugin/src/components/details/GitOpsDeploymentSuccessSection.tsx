import * as React from 'react';
import { ChartDonut, ChartThemeColor } from '@patternfly/react-charts';
import { StackItem, Card, CardBody, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { truncateMiddle } from '@console/internal/components/utils';
import './GitOpsDeploymentSuccessSection.scss';

enum DeploymentOutcomes {
  Success = 'success',
  Failed = 'failed',
}

const GitOpsDeploymentSuccessSection: React.FC = () => {
  const { t } = useTranslation();

  const synced = 35;
  const outOfSync = 55;
  const unknown = 10;
  const totalValue = synced + outOfSync + unknown;

  const title = synced ? `${((synced * 100) / totalValue).toFixed(1)}%` : '';
  const subTitle = synced
    ? t('gitops-plugin~{{synced}} of {{totalValue}} succeeded', {
        synced,
        totalValue,
      })
    : '';

  return (
    <>
      <StackItem>
        <Card>
          <Split className="odc-gitops-deployment-success__header">
            <SplitItem>
              <h3 className="odc-gitops-deployment-success__title co-nowrap">
                {t('gitops-plugin~Deployment success ratio')}
              </h3>
            </SplitItem>
            <SplitItem>
              <p className="odc-gitops-deployment-success__timespan co-nowrap">
                {t('gitops-plugin~Last 30 days')}
              </p>
            </SplitItem>
          </Split>
          <CardBody style={{ height: '216px', paddingBottom: '0px' }}>
            <Tooltip content={t('gitops-plugin~Synced {{title}}', title)}>
              <ChartDonut
                ariaDesc={t('gitops-plugin~Success Ratio of Deployments')}
                ariaTitle={''}
                constrainToVisibleArea
                data={[
                  { x: t('gitops-plugin~Synced'), y: synced },
                  { x: t('OutOfSync'), y: outOfSync + unknown },
                ]}
                sortKey={
                  synced
                    ? [DeploymentOutcomes.Success, DeploymentOutcomes.Failed]
                    : [DeploymentOutcomes.Failed]
                }
                labels={({ datum }) => `${_.capitalize(datum.x)}: ${datum.y}%`}
                colorScale={
                  synced ? [ChartThemeColor.green, dangerColor.value] : [dangerColor.value]
                }
                radius={85}
                innerRadius={75}
                subTitle={truncateMiddle(subTitle, { length: 20 })}
                title={truncateMiddle(title, { length: 10 })}
              />
            </Tooltip>
          </CardBody>
        </Card>
      </StackItem>
    </>
  );
};

export default GitOpsDeploymentSuccessSection;
