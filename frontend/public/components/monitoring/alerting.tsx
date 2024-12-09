/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Alert,
  AlertSeverity,
  AlertStates,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  PrometheusAlert,
  RedExclamationCircleIcon,
  RowFilter,
  RowProps,
  Rule,
  Silence,
  SilenceStates,
  TableColumn,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import {
  ListPageFilter,
  Timestamp,
  useListPageFilter,
  VirtualizedTable,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { withFallback } from '@console/shared/src/components/error';
import { useExactSearch } from '@console/app/src/components/user-preferences/search';
import {
  Alert as PFAlert,
  Breadcrumb,
  BreadcrumbItem,
  DropdownItem,
  Button,
  Checkbox,
  Flex,
  FlexItem,
  Label,
  Modal,
  ModalVariant,
} from '@patternfly/react-core';
import {
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
  DropdownPosition as DropdownPositionDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
  KebabToggle as KebabToggleDeprecated,
  KebabToggleProps as KebabTogglePropsDeprecated,
} from '@patternfly/react-core/deprecated';
import { BanIcon } from '@patternfly/react-icons/dist/esm/icons/ban-icon';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { BellSlashIcon } from '@patternfly/react-icons/dist/esm/icons/bell-slash-icon';
import { HourglassHalfIcon } from '@patternfly/react-icons/dist/esm/icons/hourglass-half-icon';
import { OutlinedBellIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-bell-icon';
import { sortable } from '@patternfly/react-table';
import classNames from 'classnames';
import i18next from 'i18next';
import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, useParams, Link, useNavigate } from 'react-router-dom-v5-compat';
import {
  ContainerModel,
  DaemonSetModel,
  DeploymentModel,
  JobModel,
  NamespaceModel,
  NodeModel,
  PodModel,
  StatefulSetModel,
} from '../../models';
import { RootState } from '../../redux';
import { refreshNotificationPollers } from '../notification-drawer';
import { SectionHeading } from '../utils/headings';
import { getURLSearchParams } from '../utils/link';
import { LoadingInline, StatusBox } from '../utils/status-box';
import { useBoolean } from './hooks/useBoolean';
import KebabDropdown from './kebab-dropdown';
import { CreateSilence } from './silence-form';
import { TargetsUI } from './targets';
import { MonitoringResource, Silences } from './types';
import {
  alertDescription,
  alertURL,
  labelsToParams,
  silenceMatcherEqualitySymbol,
  SilenceResource,
  silenceState,
} from './utils';
import { exactMatch, fuzzyCaseInsensitive } from '../factory/table-filters';
import { AlertmanagerConfig } from './alertmanager/alertmanager-config';
import AlertmanagerYAML from './alertmanager/alertmanager-yaml-editor';

const SelectedSilencesContext = React.createContext({
  selectedSilences: new Set(),
  setSelectedSilences: undefined,
});

const ruleURL = (rule: Rule, namespace: string) =>
  namespace
    ? `/dev-monitoring/ns/${namespace}/alertrules/${rule?.id}`
    : `/monitoring/alertrules/${rule?.id}`;

const MonitoringResourceIcon: React.FC<MonitoringResourceIconProps> = ({ className, resource }) => (
  <span
    className={classNames(
      `co-m-resource-icon co-m-resource-${resource.kind.toLowerCase()}`,
      className,
    )}
    title={resource.label}
  >
    {resource.abbr}
  </span>
);

const AlertStateIcon: React.FC<{ state: string }> = React.memo(({ state }) => {
  switch (state) {
    case AlertStates.Firing:
      return <BellIcon />;
    case AlertStates.Pending:
      return <OutlinedBellIcon />;
    case AlertStates.Silenced:
      return <BellSlashIcon className="text-muted" />;
    default:
      return null;
  }
});

const getAlertStateKey = (state) => {
  switch (state) {
    case AlertStates.Firing:
      return i18next.t('public~Firing');
    case AlertStates.Pending:
      return i18next.t('public~Pending');
    case AlertStates.Silenced:
      return i18next.t('public~Silenced');
    default:
      return i18next.t('public~Not Firing');
  }
};

export const AlertState: React.FC<AlertStateProps> = React.memo(({ state }) => {
  const icon = <AlertStateIcon state={state} />;

  return icon ? (
    <>
      {icon} {getAlertStateKey(state)}
    </>
  ) : null;
});

const SilenceState = ({ silence }) => {
  const { t } = useTranslation();

  const state = silenceState(silence);
  const icon = {
    [SilenceStates.Active]: <GreenCheckCircleIcon />,
    [SilenceStates.Pending]: <HourglassHalfIcon className="monitoring-state-icon--pending" />,
    [SilenceStates.Expired]: <BanIcon className="text-muted" data-test-id="ban-icon" />,
  }[state];

  const getStateKey = (stateData) => {
    switch (stateData) {
      case SilenceStates.Active:
        return t('public~Active');
      case SilenceStates.Pending:
        return t('public~Pending');
      default:
        return t('public~Expired');
    }
  };

  return icon ? (
    <>
      {icon} {getStateKey(state)}
    </>
  ) : null;
};

export const StateTimestamp = ({ text, timestamp }) => (
  <div className="text-muted monitoring-timestamp">
    {text}&nbsp;
    <Timestamp timestamp={timestamp} />
  </div>
);

const SeverityIcon: React.FC<{ severity: string }> = React.memo(({ severity }) => {
  const Icon =
    {
      [AlertSeverity.Critical]: RedExclamationCircleIcon,
      [AlertSeverity.Info]: BlueInfoCircleIcon,
      [AlertSeverity.None]: BlueInfoCircleIcon,
      [AlertSeverity.Warning]: YellowExclamationTriangleIcon,
    }[severity] || YellowExclamationTriangleIcon;
  return <Icon />;
});

export const Severity: React.FC<{ severity: string }> = React.memo(({ severity }) => {
  const { t } = useTranslation();

  const getSeverityKey = (severityData: string) => {
    switch (severityData) {
      case AlertSeverity.Critical:
        return t('public~Critical');
      case AlertSeverity.Info:
        return t('public~Info');
      case AlertSeverity.Warning:
        return t('public~Warning');
      case AlertSeverity.None:
        return t('public~None');
      default:
        return severityData;
    }
  };

  return _.isNil(severity) ? (
    <>-</>
  ) : (
    <>
      <SeverityIcon severity={severity} /> {getSeverityKey(severity)}
    </>
  );
});

const SeverityCounts: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  if (_.isEmpty(alerts)) {
    return <>-</>;
  }

  const counts = _.countBy(alerts, (a) => {
    const { severity } = a.labels;
    return severity === AlertSeverity.Critical || severity === AlertSeverity.Warning
      ? severity
      : AlertSeverity.Info;
  });

  const severities = [AlertSeverity.Critical, AlertSeverity.Warning, AlertSeverity.Info].filter(
    (s) => counts[s] > 0,
  );

  return (
    <>
      {severities.map((s) => (
        <span className="monitoring-icon-wrap" key={s}>
          <SeverityIcon severity={s} /> {counts[s]}
        </span>
      ))}
    </>
  );
};

export const StateCounts: React.FC<{ alerts: PrometheusAlert[] }> = ({ alerts }) => {
  const counts = _.countBy(alerts, 'state');
  const states = [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].filter(
    (s) => counts[s] > 0,
  );

  return (
    <>
      {states.map((s) => (
        <div className="monitoring-icon-wrap" key={s}>
          <AlertStateIcon state={s} /> {counts[s]} {getAlertStateKey(s)}
        </div>
      ))}
    </>
  );
};

const tableSilenceClasses = [
  'pf-v5-c-table__action', // Checkbox
  'pf-v5-u-w-50 pf-v5-u-w-33-on-sm', // Name
  'pf-m-hidden pf-m-visible-on-sm', // Firing alerts
  '', // State
  'pf-m-hidden pf-m-visible-on-sm', // Creator
  'dropdown-kebab-pf pf-v5-c-table__action',
];

const SilenceMatchersList = ({ silence }) => (
  <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
    {_.map(silence.matchers, ({ name, isEqual, isRegex, value }, i) => (
      <Label className="co-label" key={i}>
        <span className="co-label__key">{name}</span>
        <span className="co-label__eq">{silenceMatcherEqualitySymbol(isEqual, isRegex)}</span>
        <span className="co-label__value">{value}</span>
      </Label>
    ))}
  </div>
);

type SilenceTableRowProps = {
  obj: Silence;
  showCheckbox?: boolean;
};

const SilenceTableRow: React.FC<SilenceTableRowProps> = ({ obj, showCheckbox }) => {
  const { t } = useTranslation();

  const { createdBy, endsAt, firingAlerts, id, name, startsAt } = obj;
  const state = silenceState(obj);

  const { selectedSilences, setSelectedSilences } = React.useContext(SelectedSilencesContext);

  const onCheckboxChange = React.useCallback(
    (_event, isChecked: boolean) => {
      setSelectedSilences((oldSet) => {
        const newSet = new Set(oldSet);
        if (isChecked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    },
    [id, setSelectedSilences],
  );

  const { ns: namespace } = useParams();

  return (
    <>
      {showCheckbox && (
        <td className={tableSilenceClasses[0]}>
          <Checkbox
            id={id}
            isChecked={selectedSilences.has(id)}
            isDisabled={state === SilenceStates.Expired}
            onChange={onCheckboxChange}
          />
        </td>
      )}
      <td className={tableSilenceClasses[1]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link
            className="co-resource-item__resource-name"
            data-test-id="silence-resource-link"
            title={id}
            to={
              namespace
                ? `/dev-monitoring/ns/${namespace}/silences/${id}`
                : `/monitoring/silences/${id}`
            }
          >
            {name}
          </Link>
        </div>
        <div className="monitoring-label-list">
          <SilenceMatchersList silence={obj} />
        </div>
      </td>
      <td className={tableSilenceClasses[2]}>
        <SeverityCounts alerts={firingAlerts} />
      </td>
      <td className={classNames(tableSilenceClasses[3], 'co-break-word')}>
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && (
          <StateTimestamp text={t('public~Starts')} timestamp={startsAt} />
        )}
        {state === SilenceStates.Active && (
          <StateTimestamp text={t('public~Ends')} timestamp={endsAt} />
        )}
        {state === SilenceStates.Expired && (
          <StateTimestamp text={t('public~Expired')} timestamp={endsAt} />
        )}
      </td>
      <td className={tableSilenceClasses[4]}>{createdBy || '-'}</td>
      <td className={tableSilenceClasses[5]}>
        <SilenceDropdownKebab silence={obj} />
      </td>
    </>
  );
};

const SilenceTableRowWithCheckbox: React.FC<RowProps<Silence>> = ({ obj }) => (
  <SilenceTableRow showCheckbox={true} obj={obj} />
);

export const alertMessageResources: {
  [labelName: string]: { kind: string; namespaced?: boolean };
} = {
  container: ContainerModel,
  daemonset: DaemonSetModel,
  deployment: DeploymentModel,
  job: JobModel,
  namespace: NamespaceModel,
  node: NodeModel,
  pod: PodModel,
  statefulset: StatefulSetModel,
};

type ExpireSilenceModalProps = {
  isOpen: boolean;
  setClosed: () => void;
  silenceID: string;
};

const ExpireSilenceModal: React.FC<ExpireSilenceModalProps> = ({
  isOpen,
  setClosed,
  silenceID,
}) => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();

  const [isInProgress, , setInProgress, setNotInProgress] = useBoolean(false);
  const [errorMessage, setErrorMessage] = React.useState();

  const expireSilence = () => {
    setInProgress();
    const url = namespace
      ? `api/alertmanager-tenancy/api/v2/silence/${silenceID}?namespace=${namespace}`
      : `${window.SERVER_FLAGS.alertManagerBaseURL}/api/v2/silence/${silenceID}`;
    consoleFetchJSON
      .delete(url)
      .then(() => {
        refreshNotificationPollers();
        setClosed();
      })
      .catch((err) => {
        setErrorMessage(_.get(err, 'json.error') || err.message || 'Error expiring silence');
        setNotInProgress();
      })
      .then(setNotInProgress);
  };

  return (
    <Modal
      isOpen={isOpen}
      position="top"
      showClose={false}
      title={t('public~Expire silence')}
      variant={ModalVariant.small}
    >
      <Flex direction={{ default: 'column' }}>
        <FlexItem>{t('public~Are you sure you want to expire this silence?')}</FlexItem>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            {errorMessage && (
              <PFAlert
                className="co-alert co-alert--scrollable"
                isInline
                title={t('public~An error occurred')}
                variant="danger"
              >
                <div className="co-pre-line">{errorMessage}</div>
              </PFAlert>
            )}
          </FlexItem>
          <Flex>
            <FlexItem>{isInProgress && <LoadingInline />}</FlexItem>
            <FlexItem align={{ default: 'alignRight' }}>
              <Button variant="secondary" onClick={setClosed}>
                {t('public~Cancel')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="primary" onClick={expireSilence}>
                {t('public~Expire silence')}
              </Button>
            </FlexItem>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
};

type SilenceDropdownProps = {
  className?: string;
  isPlain?: boolean;
  silence: Silence;
  Toggle: React.FC<{ onToggle: KebabTogglePropsDeprecated['onToggle'] }>;
};

const SilenceDropdown: React.FC<SilenceDropdownProps> = ({
  className,
  isPlain,
  silence,
  Toggle,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { ns: namespace } = useParams();

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);
  const [isModalOpen, , setModalOpen, setModalClosed] = useBoolean(false);

  const editSilence = () => {
    navigate(
      namespace
        ? `/dev-monitoring/ns/${namespace}/silences/${silence.id}/edit`
        : `/monitoring/silences/${silence.id}/edit`,
    );
  };

  const dropdownItems =
    silenceState(silence) === SilenceStates.Expired
      ? [
          <DropdownItemDeprecated key="edit-silence" component="button" onClick={editSilence}>
            {t('public~Recreate silence')}
          </DropdownItemDeprecated>,
        ]
      : [
          <DropdownItemDeprecated key="edit-silence" component="button" onClick={editSilence}>
            {t('public~Edit silence')}
          </DropdownItemDeprecated>,
          <DropdownItemDeprecated key="cancel-silence" component="button" onClick={setModalOpen}>
            {t('public~Expire silence')}
          </DropdownItemDeprecated>,
        ];

  return (
    <>
      <DropdownDeprecated
        className={className}
        data-test="silence-actions"
        dropdownItems={dropdownItems}
        isOpen={isOpen}
        isPlain={isPlain}
        onSelect={setClosed}
        position={DropdownPositionDeprecated.right}
        toggle={<Toggle onToggle={setIsOpen} />}
      />
      <ExpireSilenceModal isOpen={isModalOpen} setClosed={setModalClosed} silenceID={silence.id} />
    </>
  );
};

const SilenceDropdownKebab: React.FC<{ silence: Silence }> = ({ silence }) => (
  <SilenceDropdown isPlain silence={silence} Toggle={KebabToggleDeprecated} />
);

const ActionsToggle: React.FC<{ onToggle: KebabTogglePropsDeprecated['onToggle'] }> = ({
  onToggle,
  ...props
}) => (
  <DropdownToggleDeprecated data-test="silence-actions-toggle" onToggle={onToggle} {...props}>
    Actions
  </DropdownToggleDeprecated>
);

const SilenceDropdownActions: React.FC<{ silence: Silence }> = ({ silence }) => (
  <SilenceDropdown className="co-actions-menu" silence={silence} Toggle={ActionsToggle} />
);

const SilencedAlertsList = ({ alerts }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { ns: namespace } = useParams();

  return _.isEmpty(alerts) ? (
    <div className="pf-v5-u-text-align-center">{t('public~None found')}</div>
  ) : (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-9">{t('public~Name')}</div>
        <div className="col-xs-3">{t('public~Severity')}</div>
      </div>
      <div className="co-m-table-grid__body">
        {_.sortBy(alerts, alertDescription).map((a, i) => (
          <div className="row co-resource-list__item" key={i}>
            <div className="col-xs-9">
              <Link
                className="co-resource-item"
                data-test="firing-alerts"
                to={
                  namespace
                    ? `/dev-monitoring/ns/${namespace}/alerts/${a.rule.id}?${labelsToParams(
                        a.labels,
                      )}`
                    : alertURL(a, a.rule.id)
                }
              >
                {a.labels.alertname}
              </Link>
              <div className="monitoring-description">{alertDescription(a)}</div>
            </div>
            <div className="col-xs-3">
              <Severity severity={a.labels.severity} />
            </div>
            <div className="dropdown-kebab-pf">
              <KebabDropdown
                dropdownItems={[
                  <DropdownItem
                    key="view-rule"
                    onClick={() => navigate(ruleURL(a.rule, namespace))}
                  >
                    {t('public~View alerting rule')}
                  </DropdownItem>,
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SilencesDetailsPage_: React.FC<{}> = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { ns: namespace } = params;

  const alertsLoaded = useSelector(
    ({ observe }: RootState) => observe.get(namespace ? 'devAlerts' : 'alerts')?.loaded,
  );

  const silences: Silences = useSelector(({ observe }: RootState) =>
    observe.get(namespace ? 'devSilences' : 'silences'),
  );
  const silence = _.find(silences?.data, { id: params?.id });

  return (
    <>
      <Helmet>
        <title>
          {t('public~{{name}} details', { name: silence?.name || SilenceResource.label })}
        </title>
      </Helmet>
      <StatusBox
        data={silence}
        label={SilenceResource.label}
        loaded={silences?.loaded}
        loadError={silences?.loadError}
      >
        <div className="pf-v5-c-page__main-breadcrumb">
          <Breadcrumb className="monitoring-breadcrumbs">
            <BreadcrumbItem>
              <Link
                className="pf-v5-c-breadcrumb__link"
                to={namespace ? `/dev-monitoring/ns/${namespace}/silences` : '/monitoring/silences'}
              >
                {t('public~Silences')}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('public~Silence details')}</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
          <h1 className="co-m-pane__heading">
            <div data-test="resource-title" className="co-resource-item">
              <MonitoringResourceIcon
                className="co-m-resource-icon--lg"
                resource={SilenceResource}
              />
              {silence?.name}
            </div>
            <div className="co-actions" data-test-id="details-actions">
              {silence && <SilenceDropdownActions silence={silence} />}
            </div>
          </h1>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Silence details')} />
          <div className="co-m-pane__body-group">
            <div className="row">
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  {silence?.name && (
                    <>
                      <dt>{t('public~Name')}</dt>
                      <dd>{silence?.name}</dd>
                    </>
                  )}
                  <dt>{t('public~Matchers')}</dt>
                  <dd data-test="label-list">
                    {_.isEmpty(silence?.matchers) ? (
                      <div className="text-muted">{t('public~No matchers')}</div>
                    ) : (
                      <SilenceMatchersList silence={silence} />
                    )}
                  </dd>
                  <dt>{t('public~State')}</dt>
                  <dd>
                    <SilenceState silence={silence} />
                  </dd>
                  <dt>{t('public~Last updated at')}</dt>
                  <dd>
                    <Timestamp timestamp={silence?.updatedAt} />
                  </dd>
                </dl>
              </div>
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>{t('public~Starts at')}</dt>
                  <dd>
                    <Timestamp timestamp={silence?.startsAt} />
                  </dd>
                  <dt>{t('public~Ends at')}</dt>
                  <dd>
                    <Timestamp timestamp={silence?.endsAt} />
                  </dd>
                  <dt>{t('public~Created by')}</dt>
                  <dd>{silence?.createdBy || '-'}</dd>
                  <dt>{t('public~Comment')}</dt>
                  <dd>{silence?.comment || '-'}</dd>
                  <dt>{t('public~Firing alerts')}</dt>
                  <dd>
                    {alertsLoaded ? (
                      <SeverityCounts alerts={silence?.firingAlerts} />
                    ) : (
                      <LoadingInline />
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="co-m-pane__body-group">
            <SectionHeading text={t('public~Firing alerts')} />
            <div className="row">
              <div className="col-xs-12">
                {alertsLoaded ? (
                  <SilencedAlertsList alerts={silence?.firingAlerts} />
                ) : (
                  <LoadingInline />
                )}
              </div>
            </div>
          </div>
        </div>
      </StatusBox>
    </>
  );
};
export const SilencesDetailsPage = withFallback(SilencesDetailsPage_);

export const severityRowFilter = (): RowFilter => ({
  filter: (filter, alert: Alert) =>
    filter.selected?.includes(alert.labels?.severity) || _.isEmpty(filter.selected),
  filterGroupName: i18next.t('public~Severity'),
  items: [
    { id: AlertSeverity.Critical, title: i18next.t('public~Critical') },
    { id: AlertSeverity.Warning, title: i18next.t('public~Warning') },
    { id: AlertSeverity.Info, title: i18next.t('public~Info') },
    { id: AlertSeverity.None, title: i18next.t('public~None') },
  ],
  reducer: ({ labels }: Alert | Rule) => labels?.severity,
  type: 'alert-severity',
});

const ruleHasAlertState = (rule: Rule, state: AlertStates): boolean =>
  state === AlertStates.NotFiring ? _.isEmpty(rule.alerts) : _.some(rule.alerts, { state });

const ruleAlertStateFilter = (filter, rule: Rule) =>
  (filter.selected?.includes(AlertStates.NotFiring) && _.isEmpty(rule.alerts)) ||
  _.some(rule.alerts, (a) => filter.selected?.includes(a.state)) ||
  _.isEmpty(filter.selected);

export const alertStateFilter = (): RowFilter => ({
  filter: ruleAlertStateFilter,
  filterGroupName: i18next.t('public~Alert State'),
  isMatch: ruleHasAlertState,
  items: [
    { id: AlertStates.Firing, title: i18next.t('public~Firing') },
    { id: AlertStates.Pending, title: i18next.t('public~Pending') },
    { id: AlertStates.Silenced, title: i18next.t('public~Silenced') },
    { id: AlertStates.NotFiring, title: i18next.t('public~Not Firing') },
  ],
  type: 'alerting-rule-has-alert-state',
});

const CreateSilenceButton: React.FC<{}> = React.memo(() => {
  const { t } = useTranslation();

  const { ns: namespace } = useParams();

  return (
    <Link
      className="co-m-primary-action"
      to={namespace ? `/dev-monitoring/ns/${namespace}/silences/~new` : '/monitoring/silences/~new'}
    >
      <Button data-test="create-silence-btn" variant="primary">
        {t('public~Create silence')}
      </Button>
    </Link>
  );
});

type ExpireAllSilencesButtonProps = {
  setErrorMessage: (string) => void;
};

const ExpireAllSilencesButton: React.FC<ExpireAllSilencesButtonProps> = ({ setErrorMessage }) => {
  const { t } = useTranslation('public');

  const { ns: namespace } = useParams();

  const [isInProgress, , setInProgress, setNotInProgress] = useBoolean(false);

  const { selectedSilences, setSelectedSilences } = React.useContext(SelectedSilencesContext);

  const onClick = () => {
    setInProgress();
    Promise.allSettled(
      [...selectedSilences].map((silenceID) =>
        consoleFetchJSON.delete(
          namespace
            ? `api/alertmanager-tenancy/api/v2/silence/${silenceID}?namespace=${namespace}`
            : `${window.SERVER_FLAGS.alertManagerBaseURL}/api/v2/silence/${silenceID}`,
        ),
      ),
    ).then((values) => {
      setNotInProgress();
      setSelectedSilences(new Set());
      refreshNotificationPollers();
      const errors = values.filter((v) => v.status === 'rejected').map((v: any) => v.reason);
      if (errors.length > 0) {
        const messages = errors.map(
          (err) => _.get(err, 'json.error') || err.message || 'Error expiring silence',
        );
        setErrorMessage(messages.join(', '));
      }
    });
  };

  return (
    <Button
      isDisabled={selectedSilences.size === 0}
      isLoading={isInProgress}
      onClick={onClick}
      variant="secondary"
    >
      {t('Expire {{count}} silence', { count: selectedSilences.size })}
    </Button>
  );
};

const silenceFiringAlertsOrder = (silence: Silence) => {
  const counts = _.countBy(silence.firingAlerts, 'labels.severity');
  return [
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Critical] ?? 0),
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Warning] ?? 0),
    silence.firingAlerts.length,
  ];
};

const silenceStateOrder = (silence: Silence) => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

const SelectAllCheckbox: React.FC<{ silences: Silence[] }> = ({ silences }) => {
  const { selectedSilences, setSelectedSilences } = React.useContext(SelectedSilencesContext);

  const activeSilences = _.filter(silences, (s) => silenceState(s) !== SilenceStates.Expired);
  const isAllSelected =
    activeSilences.length > 0 && _.every(activeSilences, (s) => selectedSilences.has(s.id));

  const onChange = React.useCallback(
    (_event, isChecked: boolean) => {
      const ids = isChecked ? activeSilences.map((s) => s.id) : [];
      setSelectedSilences(new Set(ids));
    },
    [activeSilences, setSelectedSilences],
  );

  return (
    <Checkbox
      id="select-all-silences-checkbox"
      isChecked={isAllSelected}
      isDisabled={activeSilences.length === 0}
      onChange={onChange}
    />
  );
};

const SilencesPage_: React.FC<{}> = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();

  const [selectedSilences, setSelectedSilences] = React.useState(new Set());
  const [errorMessage, setErrorMessage] = React.useState();

  const [isExactSearch] = useExactSearch();
  const matchFn: Function = isExactSearch ? exactMatch : fuzzyCaseInsensitive;

  const { data, loaded = false, loadError }: Silences = useSelector(
    ({ observe }: RootState) => observe.get(namespace ? 'devSilences' : 'silences') || {},
  );

  const nameFilter: RowFilter = {
    filter: (filter, silence: Silence) => matchFn(filter.selected?.[0], silence.name),
    items: [],
    type: 'name',
  } as RowFilter;

  const rowFilters: RowFilter[] = [
    {
      defaultSelected: [SilenceStates.Active, SilenceStates.Pending],
      filter: (filter, silence: Silence) =>
        filter.selected?.includes(silenceState(silence)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Silence State'),
      items: [
        { id: SilenceStates.Active, title: t('public~Active') },
        { id: SilenceStates.Pending, title: t('public~Pending') },
        { id: SilenceStates.Expired, title: t('public~Expired') },
      ],
      reducer: silenceState,
      type: 'silence-state',
    },
  ];

  const allFilters: RowFilter[] = [nameFilter, ...rowFilters];
  let [staticData, filteredData, onFilterChange] = useListPageFilter(data, allFilters);

  if (namespace) {
    filteredData = filteredData?.filter((item) => {
      const matchers = item.matchers;
      const nsMatcher = matchers?.find((m) => m.name === 'namespace');
      return nsMatcher?.value === namespace;
    });
  }

  const columns = React.useMemo<TableColumn<Silence>[]>(
    () => [
      {
        id: 'checkbox',
        props: { className: tableSilenceClasses[0] },
        title: (<SelectAllCheckbox silences={filteredData} />) as any,
      },
      {
        id: 'name',
        props: { className: tableSilenceClasses[1] },
        sort: 'name',
        title: t('public~Name'),
        transforms: [sortable],
      },
      {
        id: 'firingAlerts',
        props: { className: tableSilenceClasses[2] },
        sort: (silences: Silence[], direction: 'asc' | 'desc') =>
          _.orderBy(silences, silenceFiringAlertsOrder, [direction]),
        title: t('public~Firing alerts'),
        transforms: [sortable],
      },
      {
        id: 'state',
        props: { className: tableSilenceClasses[3] },
        sort: (silences: Silence[], direction: 'asc' | 'desc') =>
          _.orderBy(silences, silenceStateOrder, [direction]),
        title: t('public~State'),
        transforms: [sortable],
      },
      {
        id: 'createdBy',
        props: { className: tableSilenceClasses[4] },
        sort: 'createdBy',
        title: t('public~Creator'),
        transforms: [sortable],
      },
      {
        id: 'actions',
        props: { className: tableSilenceClasses[5] },
        title: '',
      },
    ],
    [filteredData, t],
  );

  return (
    <>
      <Helmet>
        <title>Alerting</title>
      </Helmet>
      <div className="co-m-pane__body">
        <SelectedSilencesContext.Provider value={{ selectedSilences, setSelectedSilences }}>
          <Flex>
            <FlexItem>
              <ListPageFilter
                data={staticData}
                hideLabelFilter
                loaded={loaded}
                onFilterChange={onFilterChange}
                rowFilters={rowFilters}
              />
            </FlexItem>
            <FlexItem>
              <CreateSilenceButton />
            </FlexItem>
            <FlexItem>
              <ExpireAllSilencesButton setErrorMessage={setErrorMessage} />
            </FlexItem>
          </Flex>
          {loadError && (
            <PFAlert
              className="co-alert"
              isInline
              title={t(
                'public~Error loading silences from Alertmanager. Alertmanager may be unavailable.',
              )}
              variant="danger"
            >
              {typeof loadError === 'string' ? loadError : loadError.message}
            </PFAlert>
          )}
          {errorMessage && (
            <PFAlert className="co-alert" isInline title={t('error')} variant="danger">
              {errorMessage}
            </PFAlert>
          )}
          <div className="row">
            <div className="col-xs-12">
              <VirtualizedTable<Silence>
                aria-label={t('public~Silences')}
                columns={columns}
                data={filteredData ?? []}
                loaded={loaded}
                loadError={loadError}
                Row={SilenceTableRowWithCheckbox}
                unfilteredData={data}
              />
            </div>
          </div>
        </SelectedSilencesContext.Provider>
      </div>
    </>
  );
};
export const SilencesPage = withFallback(SilencesPage_);

// Handles links that have the Prometheus UI's URL format (expected for links in alerts sent by
// Alertmanager). The Prometheus UI specifies the PromQL query with the GET param `g0.expr`, so we
// use that if it exists. Otherwise, just go to the query browser page with no query.
const PrometheusUIRedirect = () => {
  const params = getURLSearchParams();
  return <Navigate to={`/monitoring/query-browser?query0=${params['g0.expr'] || ''}`} replace />;
};

export const MonitoringUI = () => (
  <Routes>
    {/* This redirect also handles the `/monitoring/#/alerts?...` link URLs generated by
  Alertmanager (because the `#` is considered the end of the URL) */}
    <Route path="" element={<Navigate to="/monitoring/alerts" replace />} />
    <Route path="alertmanagerconfig" element={<AlertmanagerConfig />} />
    <Route path="alertmanageryaml" element={<AlertmanagerYAML />} />
    <Route path="graph" element={<PrometheusUIRedirect />} />
    <Route path="silences/~new" element={<CreateSilence />} />
    <Route path="targets/*" element={<TargetsUI />} />
  </Routes>
);

type AlertStateProps = {
  state: AlertStates;
};

type MonitoringResourceIconProps = {
  className?: string;
  resource: MonitoringResource;
};
