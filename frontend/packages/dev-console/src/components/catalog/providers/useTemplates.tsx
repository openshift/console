import { useState, useEffect, useMemo } from 'react';
import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getTemplateIcon,
  getTemplateIconClass,
} from '@console/internal/components/catalog/catalog-item-icon';
import { TemplateModel } from '@console/internal/models';
import type { PartialObjectMetadata } from '@console/internal/module/k8s';
import { k8sListPartialMetadata } from '@console/internal/module/k8s';
import type { APIError } from '@console/shared';
import { ANNOTATIONS } from '@console/shared';

const normalizeTemplates = (
  templates: PartialObjectMetadata[],
  activeNamespace: string = '',
  t: TFunction,
): CatalogItem<PartialObjectMetadata>[] => {
  const normalizedTemplates: CatalogItem<PartialObjectMetadata>[] = _.reduce(
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
      const imgURL = getTemplateIcon(template);
      const iconClass = getTemplateIconClass(template);
      const documentationUrl = annotations[ANNOTATIONS.documentationURL];
      const supportUrl = annotations[ANNOTATIONS.supportURL];

      const normalizedTemplate: CatalogItem<PartialObjectMetadata> = {
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
          url: imgURL,
        },
        cta: {
          label: t('devconsole~Instantiate Template'),
          href: `/catalog/instantiate-template?template=${name}&template-ns=${namespace}&preselected-ns=${activeNamespace}`,
        },
        data: template,
      };

      acc.push(normalizedTemplate);

      return acc;
    },
    [],
  );

  return normalizedTemplates;
};

const useTemplates: ExtensionHook<CatalogItem<PartialObjectMetadata>[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<PartialObjectMetadata[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState<boolean>(false);
  const [templatesError, setTemplatesError] = useState<APIError>();

  const [projectTemplates, setProjectTemplates] = useState<PartialObjectMetadata[]>([]);
  const [projectTemplatesLoaded, setProjectTemplatesLoaded] = useState<boolean>(false);
  const [projectTemplatesError, setProjectTemplatesError] = useState<APIError>();

  // Load templates from the shared `openshift` namespace. Don't use Firehose
  // for templates so that we can request only metadata. This keeps the request
  // much smaller.
  useEffect(() => {
    k8sListPartialMetadata(TemplateModel, { ns: 'openshift' })
      .then((metadata) => {
        setTemplates(metadata ?? []);
        setTemplatesLoaded(true);
        setTemplatesError(null);
      })
      .catch(setTemplatesError);
  }, []);

  // Load templates for the current project.
  useEffect(() => {
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

  const normalizedTemplates = useMemo(
    () => normalizeTemplates([...templates, ...projectTemplates], namespace, t),
    [namespace, projectTemplates, t, templates],
  );

  return [normalizedTemplates, loaded, error];
};

export default useTemplates;
