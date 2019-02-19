import * as React from 'react';
import './Codebases.scss';
import CodebasesList from '../../components/Codebases/List';

const CodebasesPage: React.SFC = () => {
  const mockCodebases = ['Codebase1', 'Codebase2', 'Codebase3'];
  return (
    <React.Fragment>
      <h1>This is Codebase Component.</h1>
      <CodebasesList codebases={mockCodebases} />
    </React.Fragment>
  )
}

export default CodebasesPage;
