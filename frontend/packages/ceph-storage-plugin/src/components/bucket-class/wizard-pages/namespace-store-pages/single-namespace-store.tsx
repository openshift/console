import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, Title } from '@patternfly/react-core';
import { Action, State } from '../../state';
import { NamespaceStoreDropdown } from '../../../namespace-store/namespace-store-dropdown';
import { NamespaceStoreKind } from '../../../../types';

export const SingleNamespaceStorePage: React.FC<SingleNamespaceStoreProps> = React.memo(
  ({ dispatch, namespace, state }) => {
    const { t } = useTranslation();
    const handleNSStateChange = (selectedNamespaceStore: NamespaceStoreKind) => {
      dispatch({ type: 'setWriteNamespaceStore', value: [selectedNamespaceStore] });
      dispatch({ type: 'setReadNamespaceStore', value: [selectedNamespaceStore] });
    };
    return (
      <div className="nb-create-bc-step-page">
        <Title size="xl" headingLevel="h2" className="nb-bc-step-page-form__title">
          {t('ceph-storage-plugin~Read and Write NamespaceStore ')}
        </Title>
        <p className="nb-create-bc-step-page-form__element--light-text">
          {t(
            'ceph-storage-plugin~Select one namespace-store, defines the read and write targets of the namespace bucket',
          )}
        </p>
        <Form className="nb-create-bc-step-page-form">
          <FormGroup className="nb-create-bc-step-page-form" fieldId="namespacestore-input">
            <NamespaceStoreDropdown
              id="namespacestore-input"
              className="nb-create-bc-step-page-form__dropdown"
              namespace={namespace}
              onChange={handleNSStateChange}
              selectedKey={state.readNamespaceStore[0]?.metadata?.name}
            />
          </FormGroup>
        </Form>
      </div>
    );
  },
);

type SingleNamespaceStoreProps = {
  dispatch: React.Dispatch<Action>;
  namespace?: string;
  state: State;
};
