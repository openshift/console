import * as React from 'react';
import * as _ from 'lodash';
import {
  URLPollResult,
  URLPollsResultMap,
  UseURLPolls,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useSafeFetch } from '@console/internal/components/utils';
import usePolls from './usePolls';

export const URL_POLL_DEFAULT_DELAY = 15000; // 15 seconds

export type PollsData = {
  callback: () => any;
  delay?: number;
  dependencies?: any[];
};

export type PollsDataMap = {
  [key: string]: PollsData;
};

const useURLPolls: UseURLPolls = (pollDataMap) => {
  const [pollsDataMap, setPollsDataMap] = React.useState<PollsDataMap>();
  const [resultsMap, setResultsMap] = React.useState<URLPollsResultMap>(
    Object.keys(pollDataMap)?.reduce((acc, url) => ({ ...acc, [url]: {} }), {}) || {},
  );
  const safeFetch = useSafeFetch();

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (_.isEmpty(pollDataMap)) {
      return null;
    }

    const pollsMap = Object.entries(pollDataMap).reduce((acc, [key, value]) => {
      const { url, delay, dependencies } = value;
      const pollsData: PollsData = {
        callback: null,
        delay: delay || URL_POLL_DEFAULT_DELAY,
        dependencies,
      };
      pollsData.callback = () => {
        const update: URLPollResult = {
          error: null,
          loading: true,
          response: null,
        };

        if (url) {
          // eslint-disable-next-line promise/catch-or-return
          safeFetch(url)
            .then((data) => {
              update.response = data;
              update.error = null;
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                update.response = null;
                update.error = err;
                // eslint-disable-next-line no-console
                console.error(`Error polling URL: ${err}`);
              }
            })
            .finally(() => (update.loading = false));
        } else {
          update.loading = false;
        }

        setResultsMap({ ...resultsMap, ...{ [url]: update } });
      };

      acc[key] = pollsData;
      return acc;
    }, {});

    setPollsDataMap(pollsMap);
  }, [pollDataMap, resultsMap, safeFetch]);

  usePolls(pollsDataMap);

  return resultsMap;
};

export default useURLPolls;
