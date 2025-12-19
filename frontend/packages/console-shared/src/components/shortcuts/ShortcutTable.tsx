import type { ReactNode } from 'react';

interface ShortcutTableProps {
  children?: ReactNode;
}

const ShortcutTable: Snail.FCC<ShortcutTableProps> = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);

export default ShortcutTable;
