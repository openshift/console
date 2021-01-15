import * as React from 'react';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { Button, ActionList, ActionListItem } from '@patternfly/react-core';
import { PageBody } from '@console/shared';

const ManagedKafkas = () => {
  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <StreamsInstancePage />
        <PageBody>
          <ActionList>
            <ActionListItem>
              <Button variant="primary" id="create-button">
                Create
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button variant="secondary" id="cancels-button">
                Cancel
              </Button>
            </ActionListItem>
          </ActionList>
        </PageBody>
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
