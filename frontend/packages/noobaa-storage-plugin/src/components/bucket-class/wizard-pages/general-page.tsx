import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Form,
  FormGroup,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { NsDropdown, ExternalLink } from '@console/internal/components/utils';
import { Action, State } from '../state';

const GeneralPage: React.FC<GeneralPageProps> = ({ dispatch, state }) => {
  const [description, setDescription] = React.useState(state.description);
  const [showHelp, setShowHelp] = React.useState(true);

  const onChange = (value: string, event: React.FormEvent<HTMLInputElement> | string) => {
    if (event === 'Project' || event === 'Namespace') {
      dispatch({ type: 'setNamespace', name: value });
    } else {
      dispatch({ type: 'setBucketClassName', name: value });
    }
  };

  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title="What is a Bucket Class?"
          action={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>An MCG Bucket&apos;s data location is determined by a policy called a bucketClass</p>
          <ExternalLink
            href="https://github.com/noobaa/noobaa-operator/blob/master/doc/backing-store-crd.md"
            text="Learn More"
          />
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <FormGroup
          className="nb-create-bc-step-page-form__element"
          label="Namespace"
          isRequired
          fieldId="namespace-dropdown"
        >
          <NsDropdown onChange={onChange} selectedKey={state.namespace} />
        </FormGroup>
        <FormGroup
          isRequired
          className="nb-create-bc-step-page-form__element"
          fieldId="bucketclassname-input"
          label="BucketClass Name"
          helperText="A unique name for the bucketClass within the project."
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
            value={description}
            onChange={setDescription}
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
