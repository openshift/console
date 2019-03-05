/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';

export interface CodebasesSampleListProps {
  codebases: string[],
}

const CodebasesSampleList: React.SFC<CodebasesSampleListProps> = ({ codebases }: CodebasesSampleListProps) => {
  const listItems = codebases.map(
    (codebase, index) => <li key={index}>{codebase}</li>
  );
  return (
    <ul>{listItems}</ul>
  );
};

export default CodebasesSampleList;
