import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton, Radio, Title, Form } from '@patternfly/react-core';
import { Action, State } from '../state';
import { namespacePolicyTypeRadios } from '../../../constants/bucket-class';
import '../create-bc.scss';

export const NamespacePolicyPage: React.FC<NamespacePolicyPageProps> = ({ dispatch, state }) => {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = React.useState(true);

  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title={t('ceph-storage-plugin~What is a Namespace Policy?')}
          className="nb-create-bc-step-page__info"
          actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>
            {t(
              'ceph-storage-plugin~Namespace policy can be set to one single read and write source, multi read sources or cached policy.',
            )}
          </p>
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <Title size="xl" headingLevel="h2" className="nb-bc-step-page-form__title">
          {t('ceph-storage-plugin~Namespace Policy Type')}
        </Title>
        {namespacePolicyTypeRadios(t).map((radio) => {
          const checked = radio.value === state.namespacePolicyType;
          return (
            <Radio
              {...radio}
              data-test={`${radio.value.toLowerCase()}-radio`}
              className="nb-create-bc-step-page-form__radio"
              onChange={() => {
                dispatch({ type: 'setNamespacePolicyType', value: radio.value });
              }}
              checked={checked}
              name="namespace-policy-type"
            />
          );
        })}
      </Form>
    </div>
  );
};

type NamespacePolicyPageProps = {
  dispatch: React.Dispatch<Action>;
  state: State;
};
