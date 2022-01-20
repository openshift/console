import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared';
import { getTemplateOSIcon } from '../os-icons';
import { TemplateResourceDetails } from './TemplateResourceDetails';

import './template-form.scss';

export type TemplateInfoProps = {
  template: TemplateKind;
  isCreateTemplate: boolean;
};

export const TemplateInfo: React.FC<TemplateInfoProps> = ({ template, isCreateTemplate }) => {
  const { t } = useTranslation();
  const { annotations, name } = template.metadata;
  const { description } = annotations;
  const displayName = annotations[ANNOTATIONS.displayName] || name;
  const documentationURL = annotations[ANNOTATIONS.documentationURL];
  const supportURL = annotations[ANNOTATIONS.supportURL];
  const tags = (annotations.tags || '')
    .toUpperCase()
    .split(',')
    .join(' ');
  const osIconURL = getTemplateOSIcon(template);

  return (
    <div>
      <div className="kv-template-form-details">
        <span className="kv-template-form-icon">
          {osIconURL && <img className="kv-template-form-icon__img" src={osIconURL} alt="" />}
        </span>
        <div>
          <h2>{displayName}</h2>
          {!_.isEmpty(tags) && (
            <p className="kv-template-form-details__tags">
              {_.map(tags, (tag, i) => (
                <span className="kv-template-form-details__tag" key={i}>
                  {tag}
                </span>
              ))}
            </p>
          )}
          {(documentationURL || supportURL) && (
            <List>
              {documentationURL && (
                <ListItem>
                  <ExternalLink
                    href={documentationURL}
                    text={t('kubevirt-plugin~View documentation')}
                  />
                </ListItem>
              )}
              {supportURL && (
                <ListItem>
                  <ExternalLink href={supportURL} text={t('kubevirt-plugin~Get support')} />
                </ListItem>
              )}
            </List>
          )}
        </div>
      </div>
      {description && <p>{description}</p>}
      <TemplateResourceDetails template={template} isCreateTemplate={isCreateTemplate} />
    </div>
  );
};
TemplateInfo.displayName = 'TemplateInfo';
