import * as React from 'react';
import CodebasesSampleList from '../components/codebases/SampleList';

const CodebasesPage: React.SFC = () => {
  const mockCodebases = ['Codebase1', 'Codebase2', 'Codebase3'];
  return (
    <React.Fragment>
      <h1>This is Codebase Component.</h1>
      <CodebasesSampleList codebases={mockCodebases} />
    </React.Fragment>
  );
};

export default CodebasesPage;
