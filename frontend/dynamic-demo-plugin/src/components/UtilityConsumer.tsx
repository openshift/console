import * as React from 'react';
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';

const UtilityConsumer: React.FC = () => {
  return (
    <div>
      <h2>Utilities from Dynamic Plugin SDK</h2>
      <div>
        <h3>Utility: consoleFetchJSON</h3>
        <ConsoleFetchConsumer />
      </div>
    </div>
  );
};

const ConsoleFetchConsumer: React.FC = () => {
  const [data, setData] = React.useState();

  React.useEffect(() => {
    let mounted = true;

    consoleFetchJSON('/api/kubernetes/version')
      .then((response) => {
        mounted && setData(response);
      })
      .catch((e) => console.error(e));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </p>
  );
};

export default UtilityConsumer;
