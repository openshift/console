import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionCloseButton,
  Form,
  FormGroup,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { ExternalLink } from '@console/internal/components/utils';
import { Action, State } from '../state';

const GeneralPage: React.FC<GeneralPageProps> = ({ dispatch, state }) => {
  const { t } = useTranslation();

  const [showHelp, setShowHelp] = React.useState(true);

  const onChange = (value: string) => {
    dispatch({ type: 'setBucketClassName', name: value });
  };

  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title={t('ceph-storage-plugin~What is a Bucket Class?')}
          className="nb-create-bc-step-page__info"
          actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>
            {t(
              "ceph-storage-plugin~A Multicloud Object Gateway bucket's data location is determined by a policy called a Bucket Class",
            )}
          </p>
          <ExternalLink
            href="https://github.com/noobaa/noobaa-operator/blob/master/doc/bucket-class-crd.md"
            text={t('ceph-storage-plugin~Learn More')}
          />
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <FormGroup
          isRequired
          className="nb-create-bc-step-page-form__element"
          fieldId="bucketclassname-input"
          label={t('ceph-storage-plugin~Bucket Class Name')}
          helperText={t(
            'ceph-storage-plugin~A unique name for the bucket class within the project.',
          )}
        >
          <TextInput
            data-test="bucket-class-name"
            placeholder={t('ceph-storage-plugin~my-multi-cloud-mirror')}
            type="text"
            value={state.bucketClassName}
            onChange={onChange}
            aria-label={t('ceph-storage-plugin~Bucket Class Name')}
          />
        </FormGroup>
        <FormGroup
          className="nb-create-bc-step-page-form__element"
          fieldId="bc-description"
          label={t('ceph-storage-plugin~Description(Optional)')}
        >
          <TextArea
            data-test="bucket-class-description"
            value={state.description}
            onChange={(data) => dispatch({ type: 'setDescription', value: data })}
            aria-label={t('ceph-storage-plugin~Description of bucket class')}
          />
        </FormGroup>
      </Form>
    </div>
  );
};

export default GeneralPage;

type GeneralPageProps = {
  dispatch: React.Dispatch<Action>;
  state: State;
};
