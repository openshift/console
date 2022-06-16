import * as React from 'react';
import { BUILDRUN_TO_BUILD_REFERENCE_LABEL } from '../../const';
import { Build } from '../../types';
import BuildRunListPage from '../buildrun-list/BuildRunListPage';

const BuildRuns: React.FC<{ obj: Build }> = ({ obj: build }) => {
  return (
    <BuildRunListPage
      showTitle={false}
      canCreate={false}
      namespace={build.metadata.namespace}
      selector={{
        matchLabels: { [BUILDRUN_TO_BUILD_REFERENCE_LABEL]: build.metadata?.name },
      }}
    />
  );
};

export default BuildRuns;
