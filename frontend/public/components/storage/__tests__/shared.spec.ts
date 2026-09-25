import {
  getAccessModeForProvisioner,
  getProvisionerModeMapping,
  getVolumeModeForProvisioner,
} from '../shared';

describe('storage shared helpers', () => {
  describe('getAccessModeForProvisioner', () => {
    it('includes ReadWriteOncePod for Cinder CSI Filesystem', () => {
      expect(getAccessModeForProvisioner('cinder.csi.openstack.org', false, 'Filesystem')).toEqual([
        'ReadWriteOnce',
        'ReadWriteOncePod',
      ]);
    });

    it('includes ReadWriteOncePod for Cinder CSI Block', () => {
      expect(getAccessModeForProvisioner('cinder.csi.openstack.org', false, 'Block')).toEqual([
        'ReadWriteOnce',
        'ReadWriteOncePod',
      ]);
    });

    it('includes ReadWriteOncePod for in-tree Cinder without duplicates', () => {
      expect(getAccessModeForProvisioner('kubernetes.io/cinder', false, 'Filesystem')).toEqual([
        'ReadWriteOnce',
        'ReadWriteOncePod',
      ]);
    });

    it('does not enable RWOP for Manila CSI', () => {
      expect(getAccessModeForProvisioner('manila.csi.openstack.org')).toEqual([
        'ReadWriteOnce',
        'ReadWriteMany',
        'ReadOnlyMany',
      ]);
    });

    it('filters ReadOnlyMany when ignoreReadOnly is true', () => {
      expect(getAccessModeForProvisioner('manila.csi.openstack.org', true, 'Filesystem')).toEqual([
        'ReadWriteOnce',
        'ReadWriteMany',
      ]);
    });

    it('falls back to all access modes for unknown provisioners', () => {
      expect(getAccessModeForProvisioner('unknown.provisioner.example')).toEqual([
        'ReadWriteOnce',
        'ReadWriteMany',
        'ReadOnlyMany',
        'ReadWriteOncePod',
      ]);
    });

    it('does not offer RWX or ROX for Cinder CSI', () => {
      const modes = getAccessModeForProvisioner('cinder.csi.openstack.org');
      expect(modes).toEqual(['ReadWriteOnce', 'ReadWriteOncePod']);
      expect(modes).not.toContain('ReadWriteMany');
      expect(modes).not.toContain('ReadOnlyMany');
    });
  });

  describe('getProvisionerModeMapping', () => {
    it('returns Filesystem and Block mappings for Cinder CSI including RWOP', () => {
      expect(getProvisionerModeMapping('cinder.csi.openstack.org')).toEqual({
        Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
        Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
      });
    });

    it('does not duplicate ReadWriteOncePod for in-tree Cinder', () => {
      expect(getProvisionerModeMapping('kubernetes.io/cinder')).toEqual({
        Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
        Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
      });
    });
  });

  describe('getVolumeModeForProvisioner', () => {
    it('allows Filesystem and Block for Cinder CSI with ReadWriteOncePod', () => {
      expect(getVolumeModeForProvisioner('cinder.csi.openstack.org', 'ReadWriteOncePod')).toEqual([
        'Filesystem',
        'Block',
      ]);
    });
  });
});
