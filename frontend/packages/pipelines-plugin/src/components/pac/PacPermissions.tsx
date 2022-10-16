import * as React from 'react';
import {
  FormGroup,
  ExpandableSection,
  Grid,
  GridItem,
  TextVariants,
  Text,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const PacPermissions: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <ExpandableSection
      toggleText={t('pipelines-plugin~See GitHub permissions')}
      onToggle={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
    >
      <Grid hasGutter span={6}>
        <GridItem>
          <FormGroup
            label={t('pipelines-plugin~Repository Permissions:')}
            fieldId="repo-permissions"
          >
            <Text component={TextVariants.small}>
              {t('pipelines-plugin~Checks: Read & Write')}
              <br />
              {t('pipelines-plugin~Contents: Read & Write')}
              <br />
              {t('pipelines-plugin~Issues: Read & Write')}
              <br />
              {t('pipelines-plugin~Members: Readonly')}
              <br />
              {t('pipelines-plugin~Metadata: Readonly')}
              <br />
              {t('pipelines-plugin~Organization plan: Readonly')}
              <br />
              {t('pipelines-plugin~Pull requests: Read & Write')}
            </Text>
          </FormGroup>
        </GridItem>
        <GridItem>
          <FormGroup
            label={t('pipelines-plugin~Organization permissions:')}
            fieldId="org-permissions"
          >
            <Text component={TextVariants.small}>
              {t('pipelines-plugin~Members: Readonly')}
              <br />
              {t('pipelines-plugin~Plan: Readonly')}
            </Text>
          </FormGroup>
        </GridItem>
        <GridItem>
          <FormGroup
            label={t('pipelines-plugin~Subscribe to events:')}
            fieldId="event-subscriptions"
          >
            <Text component={TextVariants.small}>
              {t('pipelines-plugin~Commit comment')}
              <br />
              {t('pipelines-plugin~Issue comment')}
              <br />
              {t('pipelines-plugin~Pull request')}
              <br />
              {t('pipelines-plugin~Pull request review')}
              <br />
              {t('pipelines-plugin~Pull request review comment')}
              <br />
              {t('pipelines-plugin~Push')}
            </Text>
          </FormGroup>
        </GridItem>
      </Grid>
    </ExpandableSection>
  );
};

export default PacPermissions;
