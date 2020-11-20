import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import {
  k8sListPartialMetadata,
  PartialObjectMetadata,
  TemplateKind,
} from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { ANNOTATIONS, APIError } from '@console/shared';
import {
  getImageForIconClass,
  getTemplateIcon,
} from '@console/internal/components/catalog/catalog-item-icon';

const normalizeTemplates = (
  templates: (TemplateKind | PartialObjectMetadata)[],
  activeNamespace: string = '',
  t: TFunction,
): CatalogItem[] => {
  const normalizedTemplates: CatalogItem[] = _.reduce(
    templates,
    (acc, template) => {
      const { uid, name, namespace, annotations = {}, creationTimestamp } = template.metadata;
      const { description } = annotations;
      const tags = (annotations.tags || '').split(/\s*,\s*/);

      if (tags.includes('hidden')) {
        return acc;
      }

      const displayName = annotations[ANNOTATIONS.displayName] || name;
      const provider = annotations[ANNOTATIONS.providerDisplayName];
      const icon = getTemplateIcon(template);
      const imgUrl = getImageForIconClass(icon);
      const iconClass = imgUrl ? null : icon;
      const documentationUrl = annotations[ANNOTATIONS.documentationURL];
      const supportUrl = annotations[ANNOTATIONS.supportURL];

      const normalizedTemplate: CatalogItem = {
        uid,
        type: 'Template',
        name: displayName,
        description,
        provider,
        tags,
        creationTimestamp,
        supportUrl,
        documentationUrl,
        icon: {
          class: iconClass,
          url: imgUrl,
        },
        cta: {
          label: t('devconsole~Instantiate Template'),
          href: `/catalog/instantiate-template?template=${name}&template-ns=${namespace}&preselected-ns=${activeNamespace}`,
        },
      };

      acc.push(normalizedTemplate);

      return acc;
    },
    [],
  );

  return normalizedTemplates;
};

const useTemplates: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [templates, setTemplates] = React.useState<TemplateKind[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = React.useState<boolean>(false);
  const [templatesError, setTemplatesError] = React.useState<APIError>();

  const [projectTemplates, setProjectTemplates] = React.useState<TemplateKind[]>([]);
  const [projectTemplatesLoaded, setProjectTemplatesLoaded] = React.useState<boolean>(false);
  const [projectTemplatesError, setProjectTemplatesError] = React.useState<APIError>();

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
    if (!namespace || namespace === 'openshift') {
      setProjectTemplates([]);
      setProjectTemplatesLoaded(true);
      setProjectTemplatesError(null);
    } else {
      k8sListPartialMetadata(TemplateModel, { ns: namespace })
        .then((metadata) => {
          setProjectTemplates(metadata ?? []);
          setProjectTemplatesLoaded(true);
          setProjectTemplatesError(null);
        })
        .catch(setProjectTemplatesError);
    }
  }, [namespace]);

  const loaded = templatesLoaded && projectTemplatesLoaded;

  const error = templatesError || projectTemplatesError;

  const normalizedTemplates = React.useMemo(
    () => normalizeTemplates([...templates, ...projectTemplates], namespace, t),
    [namespace, projectTemplates, t, templates],
  );

  return [normalizedTemplates, loaded, error];
};

export default useTemplates;
