import * as React from 'react';
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
          title="What is a Bucket Class?"
          className="nb-create-bc-step-page__info"
          actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>An MCG Bucket&apos;s data location is determined by a policy called a Bucket Class</p>
          <ExternalLink
            href="https://github.com/noobaa/noobaa-operator/blob/master/doc/bucket-class-crd.md"
            text="Learn More"
          />
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <FormGroup
          isRequired
          className="nb-create-bc-step-page-form__element"
          fieldId="bucketclassname-input"
          label="Bucket Class Name"
          helperText="A unique name for the Bucket Class within the project."
        >
          <TextInput
            placeholder="my-multi-cloud-mirror"
            type="text"
            value={state.bucketClassName}
            onChange={onChange}
            aria-label="Bucket Class Name"
          />
        </FormGroup>
        <FormGroup
          className="nb-create-bc-step-page-form__element"
          fieldId="bc-description"
          label="Description(Optional)"
        >
          <TextArea
            value={state.description}
            onChange={(data) => dispatch({ type: 'setDescription', value: data })}
            aria-label="Description of bucket class"
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
