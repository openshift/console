import * as _ from 'lodash-es';
import { Alert, ActionGroup, Button, TextArea, TextInput, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { coFetchJSON } from '../../co-fetch';
import { silenceState } from '../../reducers/monitoring';
import { RootState } from '../../redux';
import { refreshNotificationPollers } from '../notification-drawer';
import { ButtonBar } from '../utils/button-bar';
import { formatPrometheusDuration, parsePrometheusDuration } from '../utils/datetime';
import { Dropdown } from '../utils/dropdown';
import { SectionHeading } from '../utils/headings';
import { ExternalLink, getURLSearchParams } from '../utils/link';
import { history } from '../utils/router';
import { StatusBox } from '../utils/status-box';
import { SilenceStates } from './types';
import { silenceParamToProps, SilenceResource } from './utils';

const pad = (i: number): string => (i < 10 ? `0${i}` : String(i));

const formatDate = (d: Date): string =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;

const DatetimeTextInput = (props) => {
  const pattern =
    '\\d{4}/(0?[1-9]|1[012])/(0?[1-9]|[12]\\d|3[01]) (0?\\d|1\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?';
  const isValid = new RegExp(`^${pattern}$`).test(props.value);

  return (
    <div>
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {isValid ? new Date(props.value).toISOString() : 'Invalid date / time'}
          </span>,
        ]}
      >
        <TextInput
          {...props}
          aria-label="Datetime"
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
          Silences temporarily mute alerts based on a set of label selectors that you define.
          Notifications will not be sent for alerts that match all the listed values or regular
          expressions.
        </p>
      </div>

      {Info && <Info />}

      <div className="co-m-pane__body">
        <form onSubmit={onSubmit} className="monitoring-silence-alert">
          <div className="co-m-pane__body-group">
            <SectionHeading text="Duration" />
            <div className="row">
              <div className="form-group col-sm-4 col-md-5">
                <label>Silence alert from...</label>
                {isStartNow ? (
                  <DatetimeTextInput isDisabled value="Now" />
                ) : (
                  <DatetimeTextInput
                    isRequired
                    onChange={(v: string) => setStartsAt(v)}
                    value={startsAt}
                  />
                )}
              </div>
              <div className="form-group col-sm-4 col-md-2">
                <label>For...</label>
                <Dropdown
                  dropDownClassName="dropdown--full-width"
                  items={durationItems}
                  onChange={(v: string) => setDuration(v)}
                  selectedKey={duration}
                />
              </div>
              <div className="form-group col-sm-4 col-md-5">
                <label>Until...</label>
                {duration === durationOff ? (
                  <DatetimeTextInput
                    isRequired
                    onChange={(v: string) => setEndsAt(v)}
                    value={endsAt}
                  />
                ) : (
                  <DatetimeTextInput
                    isDisabled
                    value={isStartNow ? `${duration} from now` : getEndsAtValue()}
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>
                <input
                  checked={isStartNow}
                  onChange={(e) => setIsStartNow(e.currentTarget.checked)}
                  type="checkbox"
                />
                &nbsp; Start Immediately
              </label>
            </div>
          </div>

          <div className="co-m-pane__body-group">
            <SectionHeading text="Alert Labels" />
            <p className="co-help-text">
              Alerts with labels that match these selectors will be silenced instead of firing.
              Label values can be matched exactly or with a{' '}
              <ExternalLink
                href="https://github.com/google/re2/wiki/Syntax"
                text="regular expression"
              />
            </p>

            {_.map(matchers, (matcher, i: number) => (
              <div className="row" key={i}>
                <div className="form-group col-sm-4">
                  <label>Label name</label>
                  <TextInput
                    aria-label="Label name"
                    isRequired
                    onChange={(v: string) => setMatcherField(i, 'name', v)}
                    placeholder="Name"
                    value={matcher.name}
                  />
                </div>
                <div className="form-group col-sm-4">
                  <label>Label value</label>
                  <TextInput
                    aria-label="Label value"
                    isRequired
                    onChange={(v: string) => setMatcherField(i, 'value', v)}
                    placeholder="Value"
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
                      &nbsp; Use RegEx
                    </label>
                    <Tooltip content="Remove">
                      <Button
                        type="button"
                        onClick={() => removeMatcher(i)}
                        aria-label="Remove"
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
                Add
              </Button>
            </div>
          </div>

          <div className="co-m-pane__body-group">
            <SectionHeading text="Info" />
            <div className="form-group">
              <label>Creator</label>
              <TextInput
                aria-label="Creator"
                onChange={(v: string) => setCreatedBy(v)}
                value={createdBy}
              />
            </div>
            <div className="form-group">
              <label className="co-required">Comment</label>
              <TextArea
                aria-label="Comment"
                isRequired
                onChange={(v: string) => setComment(v)}
                value={comment}
              />
            </div>
            <ButtonBar errorMessage={error} inProgress={inProgress}>
              <ActionGroup className="pf-c-form">
                <Button type="submit" variant="primary">
                  Silence
                </Button>
                <Button onClick={history.goBack} variant="secondary">
                  Cancel
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

const EditInfo = () => (
  <Alert isInline className="co-alert" variant="info" title="Overwriting current silence">
    When changes are saved, the currently existing silence will be expired and a new silence with
    the new configuration will take its place.
  </Alert>
);

export const EditSilence = connect(silenceParamToProps)(({ loaded, loadError, silence }) => {
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
    <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
      <SilenceForm
        defaults={defaults}
        Info={isExpired ? undefined : EditInfo}
        title={isExpired ? 'Recreate Silence' : 'Edit Silence'}
      />
    </StatusBox>
  );
});

const CreateSilence_ = ({ createdBy }) => {
  const matchers = _.map(getURLSearchParams(), (value, name) => ({ name, value, isRegex: false }));
  return _.isEmpty(matchers) ? (
    <SilenceForm defaults={{ createdBy }} title="Create Silence" />
  ) : (
    <SilenceForm defaults={{ createdBy, matchers }} title="Silence Alert" />
  );
};
const createSilenceStateToProps = ({ UI }: RootState) => ({
  createdBy: UI.get('user')?.metadata?.name,
});
export const CreateSilence = connect(createSilenceStateToProps)(CreateSilence_);

type SilenceFormProps = {
  defaults: any;
  Info?: React.ComponentType<{}>;
  title: string;
};
