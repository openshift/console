import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeading } from '../utils/headings';
import { AlertResource, alertSource, alertState, RuleResource } from './utils';
import { ToggleGraph } from './metrics';
import { Table } from '../factory';
import { PrometheusLabels } from '../graphs';
import { Alert, Rule } from './types';
import { K8sResourceKind } from '../../module/k8s';
import {
  getSilenceTableHeader,
  Annotation,
  PopoverField,
  Graph,
  AlertMessage,
  AlertState,
  AlertStateDescription,
  Severity,
  severityHelp,
  sourceHelp,
  alertStateHelp,
  MonitoringResourceIcon,
  ruleURL,
  SilenceTableRow,
  Label,
} from './alerting';

type DetailsPageProps = {
  alert: Alert;
  loaded: boolean;
  loadError?: string;
  namespace: string;
  rule: Rule;
  silencesLoaded: boolean;
  match?: any;
  filters?: any;
  selected?: any;
  obj: K8sResourceKind;
  params?: any;
  customData?: any;
};

export const Details: React.FC<DetailsPageProps> = (props) => {
  const { alert, namespace, rule, silencesLoaded } = props;
  const state = alertState(alert);
  const { t } = useTranslation();

  const silencesTableHeader = () =>
    getSilenceTableHeader(t).map((h) => _.pick(h, ['title', 'props']));

  const labelsMemoKey = JSON.stringify(alert?.labels);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labels: PrometheusLabels = React.useMemo(() => alert?.labels, [labelsMemoKey]);
  return (
    <>
      <div className="co-m-pane__body">
        <ToggleGraph />
        <SectionHeading text={t('public~Alert details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-12">
              <Graph
                filterLabels={labels}
                namespace={namespace}
                query={rule?.query}
                ruleDuration={rule?.duration}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Name')}</dt>
                <dd>{labels?.alertname}</dd>
                <dt>
                  <PopoverField label={t('public~Severity')} body={severityHelp} />
                </dt>
                <dd>
                  <Severity severity={labels?.severity} />
                </dd>
                {alert?.annotations?.description && (
                  <Annotation title={t('public~Description')}>
                    <AlertMessage
                      alertText={alert.annotations.description}
                      labels={labels}
                      template={rule?.annotations.description}
                    />
                  </Annotation>
                )}
                <Annotation title={t('public~Summary')}>{alert?.annotations?.summary}</Annotation>
                {alert?.annotations?.message && (
                  <Annotation title={t('public~Message')}>
                    <AlertMessage
                      alertText={alert.annotations.message}
                      labels={labels}
                      template={rule?.annotations.message}
                    />
                  </Annotation>
                )}
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>
                  <PopoverField label={t('public~Source')} body={sourceHelp} />
                </dt>
                <dd>{alert && _.startCase(alertSource(alert))}</dd>
                <dt>
                  <PopoverField label={t('public~State')} body={alertStateHelp} />
                </dt>
                <dd>
                  <AlertState state={state} />
                  <AlertStateDescription alert={alert} />
                </dd>
              </dl>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <dl className="co-m-pane__details" data-test="label-list">
                <dt>{t('public~Labels')}</dt>
                <dd>
                  {_.isEmpty(labels) ? (
                    <div className="text-muted">No labels</div>
                  ) : (
                    <div className={`co-text-${AlertResource.kind.toLowerCase()}`}>
                      {_.map(labels, (v, k) => (
                        <Label key={k} k={k} v={v} />
                      ))}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <dl className="co-m-pane__details">
                <dt>{t('public~Alerting rule')}</dt>
                <dd>
                  <div className="co-resource-item">
                    <MonitoringResourceIcon resource={RuleResource} />
                    <Link
                      to={
                        namespace
                          ? `/dev-monitoring/ns/${namespace}/rules/${rule?.id}`
                          : ruleURL(rule)
                      }
                      data-test="alert-rules-detail-resource-link"
                      className="co-resource-item__resource-name"
                    >
                      {_.get(rule, 'name')}
                    </Link>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      {silencesLoaded && !_.isEmpty(alert?.silencedBy) && (
        <div className="co-m-pane__body">
          <div className="co-m-pane__body-group">
            <SectionHeading text="Silenced By" />
            <div className="row">
              <div className="col-xs-12">
                <Table
                  aria-label="Silenced By"
                  data={alert?.silencedBy}
                  Header={silencesTableHeader}
                  loaded={true}
                  Row={SilenceTableRow}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
