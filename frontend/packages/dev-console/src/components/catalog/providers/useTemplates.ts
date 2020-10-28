import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { CatalogItem, CatalogItemDetailsPropertyVariant } from '@console/plugin-sdk';
import {
  k8sListPartialMetadata,
  PartialObjectMetadata,
  TemplateKind,
} from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { ANNOTATIONS, APIError } from '@console/shared';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import {
  getImageForIconClass,
  getTemplateIcon,
} from '@console/internal/components/catalog/catalog-item-icon';

const normalizeTemplates = (
  templates: (TemplateKind | PartialObjectMetadata)[],
  activeNamespace: string = '',
): CatalogItem[] => {
  const normalizedTemplates: CatalogItem[] = _.reduce(
    templates,
    (acc, template) => {
      const { name, namespace, annotations = {} } = template.metadata;
      const tags = (annotations.tags || '').split(/\s*,\s*/);
      if (tags.includes('hidden')) {
        return acc;
      }
      const tileName = annotations[ANNOTATIONS.displayName] || name;
      const tileDescription = annotations.description;
      const tileProvider = annotations[ANNOTATIONS.providerDisplayName];
      const iconClass = getTemplateIcon(template);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const { creationTimestamp } = template.metadata;
      const documentationUrl = annotations[ANNOTATIONS.documentationURL];
      const supportUrl = annotations[ANNOTATIONS.supportURL];

      const detailsProperties = [
        {
          type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
          title: 'Support',
          label: 'Get Support',
          value: supportUrl,
        },
        {
          type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
          title: 'Documentation',
          value: documentationUrl,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TEXT,
          title: 'Provider',
          value: tileProvider,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TIMESTAMP,
          title: 'Created At',
          value: creationTimestamp,
        },
      ];

      const detailsDescriptions = [
        {
          type: CatalogItemDetailsPropertyVariant.MARKDOWN,
          title: 'Description',
          value: tileDescription,
        },
      ];

      acc.push({
        type: 'Template',
        name: tileName,
        description: tileDescription,
        provider: tileProvider,
        tags,
        obj: template,
        icon: {
          class: tileIconClass,
          url: tileImgUrl,
        },
        cta: {
          label: 'Instantiate Template',
          href: `/catalog/instantiate-template?template=${name}&template-ns=${namespace}&preselected-ns=${activeNamespace}`,
        },
        details: {
          properties: detailsProperties,
          descriptions: detailsDescriptions,
        },
      } as CatalogItem);

      return acc;
    },
    [],
  );

  return normalizedTemplates;
};

const useTemplates = (): [CatalogItem[], boolean, any] => {
  const [templates, setTemplates] = React.useState<TemplateKind[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = React.useState<boolean>(false);
  const [templatesError, setTemplatesError] = React.useState<APIError>();

  const [projectTemplates, setProjectTemplates] = React.useState<TemplateKind[]>([]);
  const [projectTemplatesLoaded, setProjectTemplatesLoaded] = React.useState<boolean>(false);
  const [projectTemplatesError, setProjectTemplatesError] = React.useState<APIError>();

  const activeNamespace = useSelector(getActiveNamespace);

  // Load templates from the shared `openshift` namespace. Don't use Firehose
  // for templates so that we can request only metadata. This keeps the request
  // much smaller.
  React.useEffect(() => {
    k8sListPartialMetadata(TemplateModel, { ns: 'openshift' })
      .then((metadata) => {
        setTemplates(metadata);
        setTemplatesLoaded(true);
        setTemplatesError(null);
      })
      .catch(setTemplatesError);
  }, []);

  // Load templates for the current project.
  React.useEffect(() => {
    // Don't load templates from the `openshift` namespace twice if it's the current namespace
    if (!activeNamespace || activeNamespace === 'openshift') {
      setProjectTemplates([]);
      setProjectTemplatesLoaded(true);
      setProjectTemplatesError(null);
    } else {
      k8sListPartialMetadata(TemplateModel, { ns: activeNamespace })
        .then((metadata) => {
          setProjectTemplates(metadata ?? []);
          setProjectTemplatesLoaded(true);
          setProjectTemplatesError(null);
        })
        .catch(setProjectTemplatesError);
    }
  }, [activeNamespace]);

  const loaded = templatesLoaded && projectTemplatesLoaded;

  const error = templatesError || projectTemplatesError;

  const normalizedTemplates = React.useMemo(
    () => normalizeTemplates([...templates, ...projectTemplates], activeNamespace),
    [activeNamespace, projectTemplates, templates],
  );

  return [normalizedTemplates, loaded, error];
};

export default useTemplates;
