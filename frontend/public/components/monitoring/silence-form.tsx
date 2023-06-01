import * as _ from 'lodash-es';
import { getUser, Silence, SilenceStates } from '@console/dynamic-plugin-sdk';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Alert,
  ActionGroup,
  Button,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  TextArea,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector } from 'react-redux';

import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { withFallback } from '@console/shared/src/components/error';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { RootState } from '../../redux';
import { refreshNotificationPollers } from '../notification-drawer';
import { ButtonBar } from '../utils/button-bar';
import { PageHeading, SectionHeading } from '../utils/headings';
import { ExternalLink, getURLSearchParams } from '../utils/link';
import { history } from '../utils/router';
import { StatusBox } from '../utils/status-box';
import { useBoolean } from './hooks/useBoolean';
import { Silences } from './types';
import { SilenceResource, silenceState } from './utils';

const pad = (i: number): string => (i < 10 ? `0${i}` : String(i));

const formatDate = (d: Date): string =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;

const DatetimeTextInput = (props) => {
  const { t } = useTranslation();

  const pattern =
    '\\d{4}/(0?[1-9]|1[012])/(0?[1-9]|[12]\\d|3[01]) (0?\\d|1\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?';
  const isValid = new RegExp(`^${pattern}$`).test(props.value);

  return (
    <div>
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {isValid ? new Date(props.value).toISOString() : t('public~Invalid date / time')}
          </span>,
        ]}
      >
        <TextInput
          {...props}
          aria-label={t('public~Datetime')}
          data-test-id="silence-datetime"
          validated={isValid || !!props.isDisabled ? 'default' : 'error'}
          pattern={pattern}
          placeholder="YYYY/MM/DD hh:mm:ss"
        />
      </Tooltip>
    </div>
  );
};

const NegativeMatcherHelp = () => {
  const { t } = useTranslation();

  return (
    <dl>
      <dd>
        {t('Select the negative matcher option to update the label value to a not equals matcher.')}
      </dd>
      <dd>
        {t(
          'If both the RegEx and negative matcher options are selected, the label value must not match the regular expression.',
        )}
      </dd>
    </dl>
  );
};

const SilenceForm_: React.FC<SilenceFormProps> = ({ defaults, Info, title }) => {
  const { t } = useTranslation();

  const [namespace] = useActiveNamespace();

  const durationOff = '-';
  const durations = {
    [durationOff]: durationOff,
    '30m': t('public~30m'),
    '1h': t('public~1h'),
    '2h': t('public~2h'),
    '6h': t('public~6h'),
    '12h': t('public~12h'),
    '1d': t('public~1d'),
    '2d': t('public~2d'),
    '1w': t('public~1w'),
  };

  const now = new Date();

  // Default to starting now if we have no default start time or if the default start time is in the
  // past (because Alertmanager will change a time in the past to the current time on save anyway)
  const defaultIsStartNow = _.isEmpty(defaults.startsAt) || new Date(defaults.startsAt) < now;

  let defaultDuration = _.isEmpty(defaults.endsAt) ? '2h' : durationOff;

  // If we have both a default start and end time and the difference between them exactly matches
  // one of the duration options, automatically select that option in the duration menu
  if (!defaultIsStartNow && defaults.startsAt && defaults.endsAt) {
    const durationFromDefaults = formatPrometheusDuration(
      Date.parse(defaults.endsAt) - Date.parse(defaults.startsAt),
    );
    if (Object.keys(durations).includes(durationFromDefaults)) {
      defaultDuration = durationFromDefaults;
    }
  }

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

  const [comment, setComment] = React.useState(defaults.comment ?? '');
  const [createdBy, setCreatedBy] = React.useState(defaults.createdBy ?? '');
  const [duration, setDuration] = React.useState(defaultDuration);
  const [endsAt, setEndsAt] = React.useState(
    defaults.endsAt ?? formatDate(new Date(new Date(now).setHours(now.getHours() + 2))),
  );
  const [error, setError] = React.useState<string>();
  const [inProgress, setInProgress] = React.useState(false);
  const [isStartNow, setIsStartNow] = React.useState(defaultIsStartNow);
  const [matchers, setMatchers] = React.useState(
    defaults.matchers ?? [{ isRegex: false, name: '', value: '' }],
  );
  const [startsAt, setStartsAt] = React.useState(defaults.startsAt ?? formatDate(now));

  const user = useSelector(getUser);

  React.useEffect(() => {
    if (_.isEmpty(createdBy)) {
      setCreatedBy(user?.metadata?.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  React.useEffect(() => {
    if (namespace) {
      setMatchers([
        { isRegex: false, name: 'namespace', value: namespace },
        ...matchers.filter((m) => m.name !== 'namespace'),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  const getEndsAtValue = (): string => {
    const startsAtDate = Date.parse(startsAt);
    return startsAtDate
      ? formatDate(new Date(startsAtDate + parsePrometheusDuration(duration)))
      : '-';
  };

  const setMatcherField = (i: number, field: string, v: any): void => {
    const newMatchers = _.clone(matchers);
    _.set(newMatchers, [i, field], v);
    setMatchers(newMatchers);
  };

  const addMatcher = (): void => {
    setMatchers([...matchers, { isRegex: false, name: '', value: '' }]);
  };

  const removeMatcher = (i: number): void => {
    const newMatchers = _.clone(matchers);
    newMatchers.splice(i, 1);

    // If all matchers have been removed, add back a single blank matcher
    setMatchers(_.isEmpty(newMatchers) ? [{ isRegex: false, name: '', value: '' }] : newMatchers);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Don't allow comments to only contain whitespace
    if (_.trim(comment) === '') {
      setError('Comment is required.');
      return;
    }

    const url = namespace
      ? `api/alertmanager-tenancy/api/v2/silences?namespace=${namespace}`
      : `${window.SERVER_FLAGS.alertManagerBaseURL}/api/v2/silences`;
    if (!url) {
      setError('Alertmanager URL not set');
      return;
    }

    setInProgress(true);

    const saveStartsAt: Date = isStartNow ? new Date() : new Date(startsAt);
    const saveEndsAt: Date =
      duration === durationOff
        ? new Date(endsAt)
        : new Date(saveStartsAt.getTime() + parsePrometheusDuration(duration));

    const body = {
      comment,
      createdBy,
      endsAt: saveEndsAt.toISOString(),
      id: defaults.id,
      matchers,
      startsAt: saveStartsAt.toISOString(),
    };

    consoleFetchJSON
      .post(url, body)
      .then(({ silenceID }) => {
        setError(undefined);
        refreshNotificationPollers();
        history.push(
          namespace
            ? `/dev-monitoring/ns/${namespace}/silences/${encodeURIComponent(silenceID)}`
            : `/monitoring/silences/${encodeURIComponent(silenceID)}`,
        );
      })
      .catch((err) => {
        const errorMessage =
          typeof _.get(err, 'json') === 'string'
            ? _.get(err, 'json')
            : err.message || 'Error saving Silence';
        setError(errorMessage);
        setInProgress(false);
      });
  };

  const dropdownItems = _.map(durations, (displayText, key) => (
    <DropdownItem key={key} onClick={() => setDuration(key)}>
      {displayText}
    </DropdownItem>
  ));

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~Silences temporarily mute alerts based on a set of label selectors that you define. Notifications will not be sent for alerts that match all the listed values or regular expressions.',
        )}
        detail
      />

      {Info && <Info />}

      <div className="co-m-pane__body">
        <form onSubmit={onSubmit} className="monitoring-silence-alert">
          <div className="co-m-pane__body-group">
            <SectionHeading text={t('public~Duration')} />
            <div className="row">
              <div className="form-group col-sm-4 col-md-5">
                <label>{t('public~Silence alert from...')}</label>
                {isStartNow ? (
                  <DatetimeTextInput isDisabled data-test="silence-from" value={t('public~Now')} />
                ) : (
                  <DatetimeTextInput
                    data-test="silence-from"
                    isRequired
                    onChange={(v: string) => setStartsAt(v)}
                    value={startsAt}
                  />
                )}
              </div>
              <div className="form-group col-sm-4 col-md-2">
                <label>{t('public~For...')}</label>
                <Dropdown
                  className="dropdown--full-width"
                  data-test="silence-for"
                  dropdownItems={dropdownItems}
                  isOpen={isOpen}
                  onSelect={setClosed}
                  toggle={
                    <DropdownToggle data-test="silence-for-toggle" onToggle={setIsOpen}>
                      {duration}
                    </DropdownToggle>
                  }
                />
              </div>
              <div className="form-group col-sm-4 col-md-5">
                <label>{t('public~Until...')}</label>
                {duration === durationOff ? (
                  <DatetimeTextInput
                    data-test="silence-until"
                    isRequired
                    onChange={(v: string) => setEndsAt(v)}
                    value={endsAt}
                  />
                ) : (
                  <DatetimeTextInput
                    data-test="silence-until"
                    isDisabled
                    value={
                      isStartNow
                        ? t('public~{{duration}} from now', { duration: durations[duration] })
                        : getEndsAtValue()
                    }
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>
                <input
                  data-test="silence-start-immediately"
                  checked={isStartNow}
                  onChange={(e) => setIsStartNow(e.currentTarget.checked)}
                  type="checkbox"
                />
                &nbsp; {t('public~Start immediately')}
              </label>
            </div>
          </div>

          <div className="co-m-pane__body-group">
            <SectionHeading text={t('public~Alert labels')} />
            <p className="co-help-text monitoring-silence-alert__paragraph">
              <Trans t={t} ns="public">
                Alerts with labels that match these selectors will be silenced instead of firing.
                Label values can be matched exactly or with a{' '}
                <ExternalLink
                  href="https://github.com/google/re2/wiki/Syntax"
                  text={t('public~regular expression')}
                />
              </Trans>
            </p>

            {_.map(matchers, (matcher, i: number) => {
              const isNamespace = !!namespace && matcher.name === 'namespace';
              return (
                <div className="row" key={i}>
                  <div className="form-group col-sm-4">
                    <label>{t('public~Label name')}</label>
                    <TextInput
                      aria-label={t('public~Label name')}
                      isDisabled={isNamespace}
                      isRequired
                      onChange={(v: string) => setMatcherField(i, 'name', v)}
                      placeholder={t('public~Name')}
                      value={matcher.name}
                    />
                  </div>
                  <div className="form-group col-sm-4">
                    <label>{t('public~Label value')}</label>
                    <TextInput
                      aria-label={t('public~Label value')}
                      isDisabled={isNamespace}
                      isRequired
                      onChange={(v: string) => setMatcherField(i, 'value', v)}
                      placeholder={t('public~Value')}
                      value={matcher.value}
                    />
                  </div>
                  {!isNamespace && (
                    <div className="form-group col-sm-4">
                      <div className="monitoring-silence-alert__label-options">
                        <label>
                          <input
                            checked={matcher.isRegex}
                            onChange={(e) => setMatcherField(i, 'isRegex', e.currentTarget.checked)}
                            type="checkbox"
                          />
                          &nbsp; {t('public~RegEx')}
                        </label>
                        <Tooltip content={<NegativeMatcherHelp />}>
                          <label>
                            <input
                              checked={matcher.isEqual === false}
                              onChange={(e) =>
                                setMatcherField(i, 'isEqual', !e.currentTarget.checked)
                              }
                              type="checkbox"
                            />
                            &nbsp; {t('public~Negative matcher')}
                          </label>
                        </Tooltip>
                        <Tooltip content={t('public~Remove')}>
                          <Button
                            type="button"
                            onClick={() => removeMatcher(i)}
                            aria-label={t('public~Remove')}
                            variant="plain"
                          >
                            <MinusCircleIcon />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="form-group">
              <Button
                className="pf-m-link--align-left"
                onClick={addMatcher}
                type="button"
                variant="link"
              >
                <PlusCircleIcon className="co-icon-space-r" />
                {t('public~Add label')}
              </Button>
            </div>
          </div>

          <div className="co-m-pane__body-group">
            <SectionHeading text={t('public~Info')} />
            <div className="form-group">
              <label>{t('public~Creator')}</label>
              <TextInput
                aria-label={t('public~Creator')}
                onChange={(v: string) => setCreatedBy(v)}
                value={createdBy}
              />
            </div>
            <div className="form-group">
              <label className="co-required">{t('public~Comment')}</label>
              <TextArea
                aria-label={t('public~Comment')}
                isRequired
                onChange={(v: string) => setComment(v)}
                data-test="silence-comment"
                value={comment}
              />
            </div>
            <ButtonBar errorMessage={error} inProgress={inProgress}>
              <ActionGroup className="pf-c-form">
                <Button type="submit" variant="primary">
                  {t('public~Silence')}
                </Button>
                <Button onClick={history.goBack} variant="secondary">
                  {t('public~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </div>
        </form>
      </div>
    </>
  );
};
const SilenceForm = withFallback(SilenceForm_);

const EditInfo = () => {
  const { t } = useTranslation();

  return (
    <Alert
      className="co-alert"
      isInline
      title={t('public~Overwriting current silence')}
      variant="info"
    >
      {t(
        'public~When changes are saved, the currently existing silence will be expired and a new silence with the new configuration will take its place.',
      )}
    </Alert>
  );
};

export const EditSilence = ({ match }) => {
  const { t } = useTranslation();

  const [namespace] = useActiveNamespace();

  const silences: Silences = useSelector(({ observe }: RootState) =>
    observe.get(namespace ? 'devSilences' : 'silences'),
  );

  const silence: Silence = _.find(silences?.data, { id: match.params.id });
  const isExpired = silenceState(silence) === SilenceStates.Expired;
  const defaults = _.pick(silence, [
    'comment',
    'createdBy',
    'endsAt',
    'id',
    'matchers',
    'startsAt',
  ]);
  defaults.startsAt = isExpired ? undefined : formatDate(new Date(defaults.startsAt));
  defaults.endsAt = isExpired ? undefined : formatDate(new Date(defaults.endsAt));

  return (
    <StatusBox
      data={silence}
      label={SilenceResource.label}
      loaded={silences?.loaded}
      loadError={silences?.loadError}
    >
      <SilenceForm
        defaults={defaults}
        Info={isExpired ? undefined : EditInfo}
        title={isExpired ? t('public~Recreate silence') : t('public~Edit silence')}
      />
    </StatusBox>
  );
};

export const CreateSilence = () => {
  const { t } = useTranslation();

  const matchers = _.map(getURLSearchParams(), (value, name) => ({ name, value, isRegex: false }));

  return _.isEmpty(matchers) ? (
    <SilenceForm defaults={{}} title={t('public~Create silence')} />
  ) : (
    <SilenceForm defaults={{ matchers }} title={t('public~Silence alert')} />
  );
};

type SilenceFormProps = {
  defaults: any;
  Info?: React.ComponentType<{}>;
  title: string;
};
