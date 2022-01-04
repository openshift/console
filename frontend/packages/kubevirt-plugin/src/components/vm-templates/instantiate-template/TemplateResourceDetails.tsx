import * as React from 'react';
import { Divider, List, ListItem, Text, TextVariants } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { TemplateKind } from '@console/internal/module/k8s';

export type TemplateResourceDetailsProps = {
  template: TemplateKind;
};

export const TemplateResourceDetails: React.FC<TemplateResourceDetailsProps> = ({ template }) => {
  const { t } = useTranslation();
  const resources = _.uniq(_.compact(_.map(template.objects, 'kind'))).sort();
  if (_.isEmpty(resources)) {
    return null;
  }

  return (
    <>
      <Divider />
      <Text component={TextVariants.h4}>
        {t('kubevirt-plugin~The following resources will be created')}:
      </Text>
      <List>
        {resources.map((kind: string) => {
          return <ListItem key={kind}>{kind}</ListItem>;
        })}
      </List>
    </>
  );
};
TemplateResourceDetails.displayName = 'TemplateResourceDetails';
