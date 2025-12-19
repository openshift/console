import * as React from 'react';

interface ShortcutTableProps {
  children?: React.ReactNode;
}

const ShortcutTable: Snail.FCC<ShortcutTableProps> = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);

export default ShortcutTable;
