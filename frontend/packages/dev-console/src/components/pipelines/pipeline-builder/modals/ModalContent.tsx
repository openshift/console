import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';

import './ModalContent.scss';

type ModalContentProps = {
  icon?: React.ReactNode;
  title: string;
  message: string;
};

const ModalContent: React.FC<ModalContentProps> = ({ icon, message, title }) => {
  return (
    <Split className="odc-modal-content" hasGutter>
      {icon && <SplitItem>{icon}</SplitItem>}
      <SplitItem isFilled>
        <h2 className="co-break-word odc-modal-content__confirm-title">{title}</h2>
        <p className="co-break-word">{message}</p>
      </SplitItem>
    </Split>
  );
};

export default ModalContent;
