import * as React from 'react';
import './List.scss';

export interface CodebasesListProps {
  codebases: Array<string>,
}

const CodebasesList: React.SFC<CodebasesListProps> = ({ codebases }: CodebasesListProps) => {
  const listItems = codebases.map(
    (codebase, index) => <li key={index}>{codebase}</li>
  );
  return (
    <ul>{listItems}</ul>
  );
}

export default CodebasesList;
