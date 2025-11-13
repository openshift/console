import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Level, LevelItem, List, ListItem, Title } from '@patternfly/react-core';
import { Language } from '@patternfly/react-code-editor';
import { BasicCodeEditor } from '@console/shared/src/components/editor/BasicCodeEditor';
import { ChevronDownIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-down-icon';
import { ChevronRightIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-right-icon';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { PasteIcon } from '@patternfly/react-icons/dist/esm/icons/paste-icon';
import { Sample } from '@console/shared/src/utils/sample-utils';
import { useTranslation } from 'react-i18next';

import { K8sKind, referenceFor } from '../../module/k8s';
import { FirehoseResult } from '../utils/types';

const ResourceSidebarSample: React.FC<ResourceSidebarSampleProps> = ({
  sample,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  const { highlightText, title, img, description, id, yaml, targetResource } = sample;
  const reference = referenceFor(targetResource);
  const { t } = useTranslation();
  return (
    <ListItem data-test="resource-sidebar-item">
      <Title headingLevel="h3" className="pf-v6-u-mb-sm">
        <span>{highlightText}</span> {title}
      </Title>
      {img && <img src={img} alt="" className="pf-v6-u-my-md" />}
      <p>{description}</p>
      <Level>
        <LevelItem>
          <Button
            icon={<PasteIcon className="co-icon-space-r" />}
            type="button"
            variant="link"
            data-test="load-sample"
            isInline
            onClick={() => loadSampleYaml(id, yaml, reference)}
          >
            {t('public~Try it')}
          </Button>
        </LevelItem>
        <LevelItem>
          <Button
            icon={<DownloadIcon className="co-icon-space-r" />}
            type="button"
            variant="link"
            data-test="download-sample"
            isInline
            onClick={() => downloadSampleYaml(id, yaml, reference)}
          >
            {t('public~Download YAML')}
          </Button>
        </LevelItem>
      </Level>
    </ListItem>
  );
};

const lineHeight = 18;
const PreviewYAML = ({ maxPreviewLines = 20, yaml }) => {
  return (
    <div style={{ paddingTop: 10 }}>
      <BasicCodeEditor
        height={`${Math.min(yaml.split('\n').length, maxPreviewLines) * lineHeight}px`}
        language={Language.yaml}
        code={yaml}
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
  insertSnippetYaml: (id: string, yaml: string, reference: string) => void;
}

const ResourceSidebarSnippet: React.FC<ResourceSidebarSnippetProps> = ({
  snippet,
  insertSnippetYaml,
}) => {
  const { highlightText, title, id, yaml, lazyYaml, targetResource, description } = snippet;

  const [yamlPreview, setYamlPreview] = React.useState<string>(yaml);
  const [yamlPreviewOpen, setYamlPreviewOpen] = React.useState(false);

  const resolveYaml = async (callback: (resolvedYaml: string) => void) => {
    if (yaml) {
      callback(yaml);
    } else if (lazyYaml) {
      try {
        callback(await lazyYaml());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Error while running lazy yaml snippet ${id} (${title})`, error);
      }
    }
  };

  const insertSnippet = () => {
    const reference = referenceFor(targetResource);
    resolveYaml((resolvedYaml) => insertSnippetYaml(id, resolvedYaml, reference));
  };

  const toggleYamlPreview = () => {
    setYamlPreviewOpen((open) => !open);
    if (!yamlPreview && !yamlPreviewOpen) {
      resolveYaml((resolvedYaml) => setYamlPreview(resolvedYaml));
    }
  };

  const { t } = useTranslation();

  return (
    <ListItem data-test="resource-sidebar-item">
      <Title headingLevel="h3" className="pf-v6-u-mb-sm">
        <span>{highlightText}</span> {title}
      </Title>
      <p>{description}</p>
      <Level>
        <LevelItem>
          <Button
            icon={<PasteIcon className="co-icon-space-r" />}
            type="button"
            variant="link"
            isInline
            onClick={insertSnippet}
          >
            {t('public~Insert snippet')}
          </Button>
        </LevelItem>
        <LevelItem>
          <Button type="button" variant="link" isInline onClick={toggleYamlPreview}>
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
        </LevelItem>
      </Level>
      {yamlPreviewOpen && yamlPreview && <PreviewYAML yaml={yamlPreview} />}
    </ListItem>
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
    <List isPlain isBordered>
      {_.map(_.sortBy(snippets, 'title'), (snippet) => (
        <ResourceSidebarSnippet
          key={snippet.id}
          snippet={snippet}
          insertSnippetYaml={insertSnippetYaml}
        />
      ))}
    </List>
  );
};

export const ResourceSidebarSamples: React.FC<ResourceSidebarSamplesProps> = ({
  samples,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  return (
    <List isPlain isBordered data-test="resource-samples-list">
      {_.map(_.sortBy(samples, 'title'), (sample) => (
        <ResourceSidebarSample
          key={sample.id}
          sample={sample}
          loadSampleYaml={loadSampleYaml}
          downloadSampleYaml={downloadSampleYaml}
        />
      ))}
    </List>
  );
};

export type LoadSampleYaml = (id: string, yaml: string, kind: string) => void;

export type DownloadSampleYaml = (id: string, yaml: string, kind: string) => void;

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
