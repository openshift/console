import * as React from 'react';
import {
    K8sResourceCommon,
    useK8sWatchResource,
    InventoryItem,
    InventoryItemTitle,
    InventoryItemLoading,
  } from '@openshift-console/dynamic-plugin-sdk';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const getCronJobsLink = (namespace: string) =>  `/k8s/ns/${namespace}/cronjobs`;

type ProjectInventoryItemProps = {
  projectName: string;
}

const ProjectInventoryItem = ({ projectName }: ProjectInventoryItemProps) => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  const [cronjobs, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: {
      group: 'batch',
      version: 'v1',
      kind: 'CronJob'
    },
    namespace: projectName,
    isList: true
  });

  const cronJobsLink = getCronJobsLink(projectName);
  let title = <Link to={cronJobsLink}>{t('{{count}} Cron Job', { count: cronjobs.length })}</Link>;
  if (loadError) {
    title = <Link to={cronJobsLink}>{t('Cron Jobs')}</Link>;
  } else if (!loaded) {
    title = <><InventoryItemLoading /><Link to={cronJobsLink}>{t('Cron Jobs')}</Link></>;
  }

  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
    </InventoryItem>
  );
}

export default ProjectInventoryItem;
