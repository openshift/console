import * as React from 'react';
import { parsePrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import {
  AlertStates,
  getUser,
  Rule,
  RuleStates,
  Silence,
  SilenceStates,
} from '@console/dynamic-plugin-sdk';
import { alertingSetRules } from '@console/internal/actions/observe';
import { coFetchJSON } from '@console/internal/co-fetch';
import { ALERTMANAGER_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { isSilenced } from '@console/internal/components/monitoring/utils';
import { Dropdown, LoadingInline } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import './SilenceDurationDropdown.scss';

type SilenceDurationDropDownProps = {
  rule: Rule;
  silenceInProgress?: (progress: boolean) => void;
  namespace: string;
};

const durations = {
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

const externalLabelFilter = ({ name }: { name: string }) => name !== 'prometheus';

const SilenceDurationDropDown: React.FC<SilenceDurationDropDownProps> = ({
  rule,
  silenceInProgress,
  namespace,
}) => {
  const { t } = useTranslation();
  const [silencing, setSilencing] = React.useState(false);
  const createdBy = useSelector((state: RootState) => getUser(state)?.username);
  const rules = useSelector(({ observe }: RootState) => observe.getIn(['devRules']));
  const ruleMatchers = _.map(rule?.labels, (value, key) => ({ isRegex: false, name: key, value }));
  const dispatch = useDispatch();

  const matchers = [
    {
      isRegex: false,
      name: 'alertname',
      value: rule.name,
    },
    ...ruleMatchers,
  ].filter(externalLabelFilter);

  const setDuration = (duration: string) => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + parsePrometheusDuration(duration));

    const payload = {
      createdBy,
      endsAt: endsAt.toISOString(),
      startsAt: startsAt.toISOString(),
      matchers,
      comment: '',
    };
    setSilencing(true);
    silenceInProgress && silenceInProgress(true);
    coFetchJSON
      .post(`${ALERTMANAGER_TENANCY_BASE_PATH}/api/v2/silences?namespace=${namespace}`, payload)
      .then(() =>
        coFetchJSON(`${ALERTMANAGER_TENANCY_BASE_PATH}/api/v2/silences?namespace=${namespace}`),
      )
      .then((silences: Silence[]) => {
        rule.silencedBy = _.filter(
          silences,
          (s: Silence) =>
            s.status.state === SilenceStates.Active && _.some(rule.alerts, isSilenced),
        );
        if (!_.isEmpty(rule.silencedBy)) {
          _.each(rule.alerts, (a) => (a.state = AlertStates.Silenced));
          rule.state = RuleStates.Silenced;
        }
        const ruleIndex = rules.findIndex((r) => r.id === rule.id);
        const updatedRules = _.cloneDeep(rules);
        updatedRules.splice(ruleIndex, 1, rule);
        dispatch(alertingSetRules('devRules', updatedRules, 'dev'));
        setSilencing(false);
        silenceInProgress && silenceInProgress(false);
      })
      .catch((err) => {
        setSilencing(false);
        silenceInProgress && silenceInProgress(false);
        // eslint-disable-next-line no-console
        console.warn('Could not set silence:', err);
      });
  };

  return (
    <>
      <Dropdown
        dropDownClassName="dropdown--full-width"
        className="odc-silence-duration-dropdown"
        items={durations}
        onChange={(v: string) => setDuration(v)}
        title={t('devconsole~Silence for')}
      />
      {silencing && <LoadingInline />}
    </>
  );
};

export default SilenceDurationDropDown;
