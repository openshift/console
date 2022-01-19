import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SwitchToYAMLAlert from '@console/shared/src/components/alerts/SwitchToYAMLAlert';
import FormSection from '../import/section/FormSection';
import ProgressiveList from '../progressive-list/ProgressiveList';
import ProgressiveListItem from '../progressive-list/ProgressiveListItem';
import EnvironmentVariablesSection from './sections/EnvironmentVariablesSection';
import HooksSection from './sections/HooksSection';
import ImagesSection from './sections/ImagesSection';
import NameSection from './sections/NameSection';
import PolicySection from './sections/PolicySection';
import SecretsSection from './sections/SecretsSection';
import SourceSection from './sections/SourceSection';
import TriggersSection from './sections/TriggersSection';

type BuildConfigFormEditorProps = {
  namespace: string;
};

const List: React.FC<BuildConfigFormEditorProps> = ({ namespace }) => {
  const { t } = useTranslation();

  const [visibleItems, setVisibleItems] = React.useState<string[]>([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList visibleItems={visibleItems} onVisibleItemChange={handleVisibleItemChange}>
      <ProgressiveListItem name={t('devconsole~Triggers')}>
        <TriggersSection namespace={namespace} />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Secrets')}>
        <SecretsSection namespace={namespace} />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Run Policy')}>
        <PolicySection />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Hooks')}>
        <HooksSection />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const BuildConfigFormEditor: React.FC<BuildConfigFormEditorProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const [showYAMLAlert, setShowYAMLAlert] = React.useState<boolean>(true);

  return (
    <>
      {showYAMLAlert && <SwitchToYAMLAlert onClose={() => setShowYAMLAlert(false)} />}

      <NameSection />
      <SourceSection />
      <ImagesSection />
      <EnvironmentVariablesSection namespace={namespace} />

      <FormSection
        title={t('devconsole~Advanced options')}
        dataTest="section advanced-options"
        fullWidth
      >
        <div>
          <Trans ns="devconsole">
            Click on the names to access advanced options for <List namespace={namespace} />.
          </Trans>
        </div>
      </FormSection>
    </>
  );
};

export default BuildConfigFormEditor;
