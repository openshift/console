import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { FirehoseResource, Firehose } from '@console/internal/components/utils';
import AddHealthChecksForm from './AddHealthChecksForm';

const HealthChecksPage: React.FC = () => {
  const { ns, kind, name, containerName } = useParams();
  const resource: FirehoseResource[] = [
    {
      kind,
      namespace: ns,
      isList: false,
      name,
      prop: 'resource',
    },
  ];

  return (
    <Firehose resources={resource}>
      <AddHealthChecksForm currentContainer={containerName} />
    </Firehose>
  );
};

export default HealthChecksPage;
