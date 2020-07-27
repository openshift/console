import * as React from 'react';
import { QuickStart } from './utils/quick-start-types';

type QuickStartControllerProps = {
  quickStart: QuickStart;
};

const QuickStartController: React.FC<QuickStartControllerProps> = ({ quickStart }) => {
  return <p>{quickStart.description}</p>;
};

export default QuickStartController;
