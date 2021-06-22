import * as React from 'react';
import { Radio, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ViewComponent } from '../../../../form-with-editor/FormWithEditor';

type CloudinitFormOrYamlSelectorProps = {
  view: ViewComponent;
  setView: Function;
};

const CloudinitFormOrYamlSelector: React.FC<CloudinitFormOrYamlSelectorProps> = ({
  view,
  setView,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Text component={TextVariants.h6}>{t('kubevirt-plugin~Configure via:')}</Text>
      <div className="kv-cloudinit-advanced-tab-with-editor--title_radio_buttons">
        <Radio
          isChecked={view === ViewComponent.editor}
          name="yaml-checkbox"
          id="CloudInitAdvancedTabWithEditor-yaml-checkbox"
          onChange={() => setView(ViewComponent.editor)}
          label={t('kubevirt-plugin~Yaml View')}
        />
        <Radio
          isChecked={view === ViewComponent.form}
          name="form-checkbox"
          id="CloudInitAdvancedTabWithEditor-form-checkbox"
          onChange={() => setView(ViewComponent.form)}
          label={t('kubevirt-plugin~Form View')}
        />
      </div>
    </>
  );
};

export default CloudinitFormOrYamlSelector;
