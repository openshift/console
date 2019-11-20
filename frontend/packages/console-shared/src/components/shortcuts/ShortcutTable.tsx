import * as React from 'react';

const ShortcutTable: React.FC = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);

export default ShortcutTable;
