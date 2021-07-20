import * as _ from 'lodash-es';
import { Alert, ActionGroup, Button, TextArea, TextInput, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { coFetchJSON } from '../../co-fetch';
import { RootState } from '../../redux';
import { refreshNotificationPollers } from '../notification-drawer';
import { ButtonBar } from '../utils/button-bar';
import { formatPrometheusDuration, parsePrometheusDuration } from '../utils/datetime';
import { Dropdown } from '../utils/dropdown';
import { SectionHeading } from '../utils/headings';
import { ExternalLink, getURLSearchParams } from '../utils/link';
import { history } from '../utils/router';
import { StatusBox } from '../utils/status-box';
import { Silence, Silences, SilenceStates } from './types';
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
          data-test-id="datetime"
          validated={isValid || !!props.isDisabled ? 'default' : 'error'}
          pattern={pattern}
          placeholder="YYYY/MM/DD hh:mm:ss"
        />
      </Tooltip>
    </div>
  );
};

const durationOff = '-';
const durations = [durationOff, '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w'];
const durationItems = _.zipObject(durations, durations);

const SilenceForm_: React.FC<SilenceFormProps> = ({ defaults, Info, title }) => {
  const { t } = useTranslation();

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
    if (durations.includes(durationFromDefaults)) {
      defaultDuration = durationFromDefaults;
    }
  }

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

    const { alertManagerBaseURL } = window.SERVER_FLAGS;
    if (!alertManagerBaseURL) {
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

    coFetchJSON
      .post(`${alertManagerBaseURL}/api/v2/silences`, body)
      .then(({ silenceID }) => {
        setError(undefined);
        refreshNotificationPollers();
        history.push(`${SilenceResource.plural}/${encodeURIComponent(silenceID)}`);
      })
      .catch((err) => {
        setError(_.get(err, 'json.error') || err.message || 'Error saving Silence');
        setInProgress(false);
      });
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          {t(
            'public~Silences temporarily mute alerts based on a set of label selectors that you define. Notifications will not be sent for alerts that match all the listed values or regular expressions.',
          )}
        </p>
      </div>

      {Info && <Info />}

      <div className="co-m-pane__body">
        <form onSubmit={onSubmit} className="monitoring-silence-alert">
          <div className="co-m-pane__body-group">
            <SectionHeading text={t('public~Duration')} />
            <div className="row">
              <div className="form-group col-sm-4 col-md-5">
                <label>{t('public~Silence alert from...')}</label>
                {isStartNow ? (
                  <DatetimeTextInput isDisabled data-test="from" value={t('public~Now')} />
                ) : (
                  <DatetimeTextInput
                    data-test="from"
                    isRequired
                    onChange={(v: string) => setStartsAt(v)}
                    value={startsAt}
                  />
                )}
              </div>
              <div className="form-group col-sm-4 col-md-2">
                <label>{t('public~For...')}</label>
                <Dropdown
                  dropDownClassName="dropdown--full-width"
                  items={durationItems}
                  onChange={(v: string) => setDuration(v)}
                  selectedKey={duration}
                />
              </div>
              <div className="form-group col-sm-4 col-md-5">
                <label>{t('public~Until...')}</label>
                {duration === durationOff ? (
                  <DatetimeTextInput
                    data-test="until"
                    isRequired
                    onChange={(v: string) => setEndsAt(v)}
                    value={endsAt}
                  />
                ) : (
                  <DatetimeTextInput
                    data-test="until"
                    isDisabled
                    value={
                      isStartNow
                        ? t('public~{{duration}} from now', { duration })
                        : getEndsAtValue()
                    }
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>
                <input
                  data-test="start-immediately"
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
            <p className="co-help-text">
              <Trans t={t} ns="public">
                Alerts with labels that match these selectors will be silenced instead of firing.
                Label values can be matched exactly or with a{' '}
                <ExternalLink
                  href="https://github.com/google/re2/wiki/Syntax"
                  text={t('public~regular expression')}
                />
              </Trans>
            </p>

            {_.map(matchers, (matcher, i: number) => (
              <div className="row" key={i}>
                <div className="form-group col-sm-4">
                  <label>{t('public~Label name')}</label>
                  <TextInput
                    aria-label={t('public~Label name')}
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
                    isRequired
                    onChange={(v: string) => setMatcherField(i, 'value', v)}
                    placeholder={t('public~Value')}
                    value={matcher.value}
                  />
                </div>
                <div className="form-group col-sm-4">
                  <div className="monitoring-silence-alert__label-options">
                    <label>
                      <input
                        type="checkbox"
                        onChange={(e) => setMatcherField(i, 'isRegex', e.currentTarget.checked)}
                        checked={matcher.isRegex}
                      />
                      &nbsp; {t('public~Use RegEx')}
                    </label>
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
              </div>
            ))}

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

  const silences: Silences = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoring', 'silences']),
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
      loaded={silences.loaded}
      loadError={silences.loadError}
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

  const user = useSelector(({ UI }: RootState) => UI.get('user'));
  const createdBy = user?.metadata?.name;

  const matchers = _.map(getURLSearchParams(), (value, name) => ({ name, value, isRegex: false }));

  return _.isEmpty(matchers) ? (
    <SilenceForm defaults={{ createdBy }} title={t('public~Create silence')} />
  ) : (
    <SilenceForm defaults={{ createdBy, matchers }} title={t('public~Silence alert')} />
  );
};

type SilenceFormProps = {
  defaults: any;
  Info?: React.ComponentType<{}>;
  title: string;
};
