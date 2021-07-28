import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils/async';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

type NetworkPolicyConditionalSelectorProps = {
  selectorType: 'pod' | 'namespace';
  helpText: string;
  values: string[][];
  onChange: (pairs: string[][]) => void;
};

export const NetworkPolicyConditionalSelector: React.FunctionComponent<NetworkPolicyConditionalSelectorProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { selectorType, helpText, values, onChange } = props;
  const [isVisible, setVisible] = React.useState(false);

  const handleSelectorChange = (updated) => {
    onChange(updated.nameValuePairs);
  };

  const title = selectorType === 'pod' ? t('public~Pod selector') : t('public~Namespace selector');
  const addSelectorText =
    selectorType === 'pod' ? t('public~Add pod selector') : t('public~Add namespace selector');
  const secondHelpText =
    selectorType === 'pod'
      ? t('public~Pods having all the supplied key/value pairs as labels will be selected.')
      : t('public~Namespaces having all the supplied key/value pairs as labels will be selected.');

  return (
    <>
      <span>
        <label>{title}</label>
      </span>
      <div className="help-block">
        <p>{helpText}</p>
      </div>
      {isVisible ? (
        <>
          <div className="help-block">
            <p>{secondHelpText}</p>
          </div>
          <NameValueEditorComponent
            nameValuePairs={values.length > 0 ? values : [['', '']]}
            valueString={t('public~Selector')}
            nameString={t('public~Label')}
            addString={t('public~Add label')}
            readOnly={false}
            allowSorting={false}
            updateParentData={handleSelectorChange}
            onLastItemRemoved={() => setVisible(false)}
          />
        </>
      ) : (
        <div className="co-toolbar__group co-toolbar__group--left co-create-networkpolicy__show-selector">
          <Button
            className="pf-m-link--align-left"
            onClick={() => setVisible(true)}
            type="button"
            variant="link"
          >
            <PlusCircleIcon className="co-icon-space-r" />
            {addSelectorText}
          </Button>
        </div>
      )}
    </>
  );
};
