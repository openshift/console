import * as React from 'react';
import yamlParser from 'js-yaml';
import { Page } from '@patternfly/react-core';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';

const simpleYAML = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'engine-controller',
  },
};

const EditorPage: React.FC = () => {
  const [data, setData] = React.useState(simpleYAML);
  const onSave = (content: string) => setData(yamlParser.load(content));
  return (
    <Page>
      <React.Suspense fallback={<></>}>
        <ResourceYAMLEditor initialResource={data} header="Simple Pod" onSave={onSave} />
      </React.Suspense>
    </Page>
  );
};

export default EditorPage;
