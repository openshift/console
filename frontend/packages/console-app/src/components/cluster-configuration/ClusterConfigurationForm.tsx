import * as React from 'react';
import { Form } from '@patternfly/react-core';
import ClusterConfigurationField from './ClusterConfigurationField';
import { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationFormProps = {
  items: ResolvedClusterConfigurationItem[];
};

const ClusterConfigurationForm: React.FC<ClusterConfigurationFormProps> = ({ items }) =>
  items?.length > 0 ? (
    <Form onSubmit={(event) => event.preventDefault()}>
      {items.map((item) => (
        <ClusterConfigurationField key={item.id} item={item} />
      ))}
    </Form>
  ) : null;
export default ClusterConfigurationForm;
