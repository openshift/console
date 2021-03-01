import * as _ from 'lodash-es';
import * as React from 'react';
import { Button } from '@patternfly/react-core';
import MonacoEditor from 'react-monaco-editor';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  PasteIcon,
} from '@patternfly/react-icons';
import { Sample } from '@console/shared';
import { useTranslation } from 'react-i18next';

import { K8sKind, referenceFor } from '../../module/k8s';
import { FirehoseResult } from '../utils';

const ResourceSidebarSample: React.FC<ResourceSidebarSampleProps> = ({
  sample,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  const { highlightText, title, img, description, id, yaml, targetResource } = sample;
  const reference = referenceFor(targetResource);
  const { t } = useTranslation();
  return (
    <li className="co-resource-sidebar-item">
      <h3 className="h4">
        <span className="text-uppercase">{highlightText}</span> {title}
      </h3>
      {img && <img src={img} className="co-resource-sidebar-item__img img-responsive" />}
      <p>{description}</p>
      <Button
        type="button"
        variant="link"
        isInline
        onClick={() => loadSampleYaml(id, yaml, reference)}
      >
        <PasteIcon className="co-icon-space-r" />
        {t('public~Try it')}
      </Button>
      <Button
        type="button"
        variant="link"
        isInline
        className="pull-right"
        onClick={() => downloadSampleYaml(id, yaml, reference)}
      >
        <DownloadIcon className="co-icon-space-r" />
        {t('public~Download YAML')}
      </Button>
    </li>
  );
};

const lineHeight = 18;
const PreviewYAML = ({ maxPreviewLines = 20, yaml }) => {
  return (
    <div style={{ paddingTop: 10 }}>
      <MonacoEditor
        height={Math.min(yaml.split('\n').length, maxPreviewLines) * lineHeight}
        language="yaml"
        value={yaml}
        options={{
          lineHeight,
          readOnly: true,
          folding: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

interface ResourceSidebarSnippetProps {
  snippet: Sample;
  insertSnippetYaml(id: string, yaml: string, reference: string);
}

const ResourceSidebarSnippet: React.FC<ResourceSidebarSnippetProps> = ({
  snippet,
  insertSnippetYaml,
}) => {
  const [yamlPreviewOpen, setYamlPreviewOpen] = React.useState(false);
  const toggleYamlPreview = () => setYamlPreviewOpen(!yamlPreviewOpen);

  const { highlightText, title, id, yaml, lazyYaml, targetResource, description } = snippet;

  const insertSnippet = () => {
    const reference = referenceFor(targetResource);
    insertSnippetYaml(id, typeof lazyYaml === 'function' ? lazyYaml() : yaml, reference);
  };

  const { t } = useTranslation();

  return (
    <li className="co-resource-sidebar-item">
      <h3 className="h4">
        <span className="text-uppercase">{highlightText}</span> {title}
      </h3>
      <p>{description}</p>
      <Button type="button" variant="link" isInline onClick={insertSnippet}>
        <PasteIcon className="co-icon-space-r" />
        {t('public~Insert snippet')}
      </Button>
      <Button
        type="button"
        className="pull-right"
        variant="link"
        isInline
        onClick={() => toggleYamlPreview()}
      >
        {yamlPreviewOpen ? (
          <>
            {t('public~Hide YAML')}
            <ChevronDownIcon className="co-icon-space-l" />
          </>
        ) : (
          <>
            {t('public~Show YAML')}
            <ChevronRightIcon className="co-icon-space-l" />
          </>
        )}
      </Button>
      {yamlPreviewOpen && <PreviewYAML yaml={typeof lazyYaml === 'function' ? lazyYaml() : yaml} />}
    </li>
  );
};

interface ResourceSidebarSnippetsProps {
  snippets: Sample[];
  insertSnippetYaml(id: string, yaml: string, reference: string);
}

export const ResourceSidebarSnippets: React.FC<ResourceSidebarSnippetsProps> = ({
  snippets,
  insertSnippetYaml,
}) => {
  return (
    <ul className="co-resource-sidebar-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
      {_.map(_.sortBy(snippets, 'title'), (snippet) => (
        <ResourceSidebarSnippet
          key={snippet.id}
          snippet={snippet}
          insertSnippetYaml={insertSnippetYaml}
        />
      ))}
    </ul>
  );
};

export const ResourceSidebarSamples: React.FC<ResourceSidebarSamplesProps> = ({
  samples,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  return (
    <ol className="co-resource-sidebar-list">
      {_.map(_.sortBy(samples, 'title'), (sample) => (
        <ResourceSidebarSample
          key={sample.id}
          sample={sample}
          loadSampleYaml={loadSampleYaml}
          downloadSampleYaml={downloadSampleYaml}
        />
      ))}
    </ol>
  );
};

type LoadSampleYaml = (id: string, yaml: string, kind: string) => void;

type DownloadSampleYaml = (id: string, yaml: string, kind: string) => void;

type ResourceSidebarSampleProps = {
  sample: Sample;
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
};

type ResourceSidebarSamplesProps = {
  samples: Sample[];
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
  yamlSamplesList?: FirehoseResult;
  kindObj: K8sKind;
};
