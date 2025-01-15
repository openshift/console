import * as React from 'react';
import yamlParser from 'js-yaml';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';

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
    <PageSection isFilled hasBodyWrapper={false} padding={{default: 'noPadding'}}>
      <React.Suspense fallback={<></>}>
        <ResourceYAMLEditor initialResource={data} header="Simple Pod" onSave={onSave} />
      </React.Suspense>
    </PageSection>
  );
};

export default EditorPage;
