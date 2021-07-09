import * as React from 'react';
import {
  Stack,
  StackItem,
  Split,
  SplitItem,
  Card,
  CardBody,
  Tooltip,
} from '@patternfly/react-core';
import { HeartBrokenIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { GitOpsEnvironmentService } from '../utils/gitops-types';
import './GitOpsResourcesSection.scss';

interface GitOpsResourcesSectionProps {
  services: GitOpsEnvironmentService[];
}

const GitOpsResourcesSection: React.FC<GitOpsResourcesSectionProps> = ({ services }) => {
  const { t } = useTranslation();

  return (
    <>
      <StackItem className="odc-gitops-resources">
        <Card>
          <h3 className="odc-gitops-resources__title co-nowrap">{t('gitops-plugin~Resources')}</h3>
          <CardBody>
            <Split style={{ justifyContent: 'space-between' }}>
              <span className="odc-gitops-resources__list">
                <SplitItem>
                  <Stack style={{ marginRight: 'var(--pf-global--spacer--sm)' }}>
                    {/* Deployments */}
                    <StackItem>{'42'}</StackItem>
                    {/* Secrets */}
                    <StackItem>{'7'}</StackItem>
                    {/* Services */}
                    <StackItem>{services.length}</StackItem>
                  </Stack>
                </SplitItem>
                <SplitItem>
                  <Stack style={{ marginRight: 'var(--pf-global--spacer--sm)' }}>
                    <StackItem>
                      <ResourceIcon kind="Deployment" /> {t('gitops-plugin~Deployments')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="Secret" /> {t('gitops-plugin~Secrets')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="Service" /> {t('gitops-plugin~Services')}
                    </StackItem>
                  </Stack>
                </SplitItem>
              </span>
              <SplitItem>
                <Stack style={{ alignItems: 'flex-end' }}>
                  {/* Broken Deployments */}
                  <Tooltip content={t('gitops-plugin~7 of 10 degraded')}>
                    <StackItem>
                      {'7'}{' '}
                      <HeartBrokenIcon
                        color="#C9190B"
                        style={{ marginLeft: 'var(--pf-global--spacer--sm)' }}
                      />
                    </StackItem>
                  </Tooltip>
                  {/* Broken Secrets */}
                  <Tooltip content={t('gitops-plugin~1000 of 2000 degraded')}>
                    <StackItem>{''}</StackItem>
                  </Tooltip>
                  {/* Broken Services */}
                  <Tooltip content={t('gitops-plugin~0 of 1 degraded')}>
                    <StackItem>
                      {'1000'}{' '}
                      <HeartBrokenIcon
                        color="#C9190B"
                        style={{ marginLeft: 'var(--pf-global--spacer--sm)' }}
                      />
                    </StackItem>
                  </Tooltip>
                </Stack>
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </StackItem>
    </>
  );
};

export default GitOpsResourcesSection;
