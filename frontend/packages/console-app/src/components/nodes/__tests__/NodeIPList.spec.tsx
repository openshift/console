import { render, screen } from '@testing-library/react';
import NodeIPList from '../NodeIPList';

describe('NodeIPList', () => {
  const mockIps = [
    { type: 'InternalIP', address: '10.0.0.1' },
    { type: 'ExternalIP', address: '192.168.1.1' },
    { type: 'Hostname', address: 'node-1.example.com' },
  ];

  it('should only show InternalIP by default', () => {
    render(<NodeIPList ips={mockIps} />);

    expect(screen.getByText('10.0.0.1')).toBeVisible();
    expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
    expect(screen.queryByText('node-1.example.com')).not.toBeInTheDocument();
  });

  it('should show all IP types when expand is true', () => {
    render(<NodeIPList ips={mockIps} expand />);

    expect(screen.getByText('10.0.0.1')).toBeVisible();
    expect(screen.getByText('192.168.1.1')).toBeVisible();
    expect(screen.getByText('node-1.example.com')).toBeVisible();
  });

  it('should display IP type labels correctly', () => {
    render(<NodeIPList ips={mockIps} expand />);

    expect(screen.getByText(/Internal IP/)).toBeVisible();
    expect(screen.getByText(/External IP/)).toBeVisible();
    expect(screen.getByText(/Hostname/)).toBeVisible();
  });

  it('should sort IPs by type', () => {
    const unorderedIps = [
      { type: 'Hostname', address: 'host' },
      { type: 'ExternalIP', address: '192.168.1.1' },
      { type: 'InternalIP', address: '10.0.0.1' },
    ];

    render(<NodeIPList ips={unorderedIps} expand />);

    const items = screen.getAllByRole('listitem');
    // Should be sorted: ExternalIP, Hostname, InternalIP (alphabetically by type)
    expect(items[0]).toHaveTextContent('External IP');
    expect(items[1]).toHaveTextContent('Hostname');
    expect(items[2]).toHaveTextContent('Internal IP');
  });

  it('should handle empty address gracefully', () => {
    const ipsWithEmpty = [
      { type: 'InternalIP', address: '10.0.0.1' },
      { type: 'ExternalIP', address: '' },
    ];

    render(<NodeIPList ips={ipsWithEmpty} expand />);

    expect(screen.getByText('10.0.0.1')).toBeVisible();
    // Empty address should not be rendered
    expect(screen.queryByText('External IP')).not.toBeInTheDocument();
  });

  it('should handle empty ips array', () => {
    render(<NodeIPList ips={[]} />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
