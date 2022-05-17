import * as React from 'react';
import { PollsDataMap, UsePolls } from '@console/dynamic-plugin-sdk/src/api/internal-types';

// Modified from Dan Abramov's blog post about using React hooks for polling
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
const usePolls: UsePolls = (pollsDataMap) => {
  const savedPollsData = React.useRef<PollsDataMap>(null);

  React.useEffect(() => {
    savedPollsData.current = pollsDataMap;
  }, [pollsDataMap]);

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    // eslint-disable-next-line consistent-return
    Object.entries(savedPollsData.current)?.forEach(([, data]) => {
      const { callback, delay } = data;
      const tick = () => callback;

      tick();

      if (delay) {
        // Only start interval if a delay is provided.
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    });
  }, [pollsDataMap]);
};

export default usePolls;
