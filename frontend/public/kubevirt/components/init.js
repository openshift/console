/*
 Initialization of kubevirt.

 Kubevirt is enabled by lazy setting of FLAGS.KUBEVIRT at runtime.
 Following setting takes place before this happens.
*/

// Override default
// Commandline: ./bin/bridge -branding=okdvirt
window.SERVER_FLAGS.branding = window.SERVER_FLAGS.branding || 'okdvirt'; // see masthead.tsx, branding.ts, examples/config.yaml, cmd/bridge/main.go
