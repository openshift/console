import * as React from 'react';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Silence } from '@console/dynamic-plugin-sdk';
import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
} from '@console/internal/actions/observe';
import { ALERTMANAGER_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import {
  URL_POLL_DEFAULT_DELAY,
  useURLPoll,
} from '@console/internal/components/utils/url-poll-hook';

export const useAlertManagerSilencesDispatch = ({ namespace }) => {
  const url = `${ALERTMANAGER_TENANCY_BASE_PATH}/api/v2/silences?namespace=${namespace}`;
  const [response, loadError, loading] = useURLPoll<Silence[]>(
    url,
    URL_POLL_DEFAULT_DELAY,
    namespace,
  );
  const dispatch = useDispatch();
  React.useEffect(() => {
    if (loadError) {
      dispatch(alertingErrored('devSilences', loadError, 'dev'));
    } else if (loading) {
      dispatch(alertingLoading('devSilences', 'dev'));
    } else {
      const silencesWithAlertsName = _.map(response, (s: Silence) => {
        const alertName = _.get(_.find(s.matchers, { name: 'alertname' }), 'value');
        return {
          ...s,
          name:
            alertName ||
            s.matchers.map((m) => `${m.name}${m.isRegex ? '=~' : '='}${m.value}`).join(', '),
        };
      });
      dispatch(alertingLoaded('devSilences', silencesWithAlertsName, 'dev'));
    }
  }, [dispatch, loadError, loading, response]);
};
