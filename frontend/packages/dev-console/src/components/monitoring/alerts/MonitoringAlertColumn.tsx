import { cellWidth, expandable, IFormatter, ITransform, sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';

type MonitoringAlertColumn = {
  title: string;
  cellFormatters?: IFormatter[];
  transforms?: ITransform[];
  fieldName?: string;
  sortFunc?: string;
  props?: { [className: string]: string };
};

export const MonitoringAlertColumn = (t: TFunction): MonitoringAlertColumn[] => [
  {
    title: t('devconsole~Name'),
    cellFormatters: [expandable],
    transforms: [sortable],
    fieldName: 'name',
    sortFunc: 'nameOrder',
  },
  {
    title: t('devconsole~Severity'),
    transforms: [sortable, cellWidth(10)],
    fieldName: 'severity',
    sortFunc: 'alertSeverityOrder',
  },
  {
    title: t('devconsole~Alert state'),
    transforms: [sortable, cellWidth(10)],
    fieldName: 'alertState',
    sortFunc: 'alertingRuleStateOrder',
  },
  {
    title: t('devconsole~Notifications'),
    transforms: [sortable],
    fieldName: 'notifications',
    sortFunc: 'alertingRuleNotificationsOrder',
    props: { className: 'odc-monitoring-alert-column--notification' },
  },
  { title: '' },
];
