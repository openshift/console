# tectonic-manager redesign

## Abstract

A proposal for simplifying, and redesigning tectonic-manager which is currently
doing many things that are either no longer necessary, or simply should no
longer be done. The goal is to modify tectonic-manager to standard yaml
manifests, in contrast to how tectonic-manager creates resources today, using
code and objects which map to Kubernetes resources.

The other major goal is to update our manifests to use the latest and greatest
Kubernetes features such as the downwardAPI, configMaps, and jobs, which
obviate a large majority of the orchestration tectonic-manager is currently
doing.

When tectonic-manager was first written, we had already known about many of
these features as proposals, and it was fairly unanimous at the time that
we would prefer to utilize these features when they became available. With 1.2
everything listed above has become enabled by default.

## Motivation

- Being able to easily modify, find, and update resources should be fairly easy,
  but today it is not. Moving to yaml files should help with this. Manifests
  would be completely static files, and the only generated manifests would
  be the configMaps and secrets the installer generates.
- We want to remove the technical debt that has accrued, particularly in
  regards to how we manage configuration and secrets. Currently this is one of
  the number one issues in debugging or configuring Tectonic.
- By using jobs it should simplify or even remove a large amount of logic that
  tectonic-manager must manage today.
- Utilizing configMaps and secrets makes the handoff between the Tectonic
  Installer and tectonic-manager very simple, as a small number of
  secrets/configMaps are all that the installer needs to know about.
- By combining configMaps, secrets, and the downwardAPI we can avoid
  ~~hacks~~tricks like creating environment files that our pod entrypoints
  source before running.

## Implementation

To start I will move all the manifests written as objects in Go into yaml
equivalents. As part of the manifest rewriting we can also now move some
configuration into into configMaps which are better suited for configuration.

We can also now begin utilizing the downwardAPI to present configMap values,
and secrets as either environment variables or volumes, meaning all of the code
which turns secrets into more secrets, and then sourcing the configuration as
the entrypoint can be entirely removed.

By using the downwardAPI a user can update any secret or configMap value
and then run `kubectl apply` on the manifest to update them. In order to
propagate these changes to the pod, the user will then need to delete and
recreate the pods depending on these new values. This could be done by deleting
the pods, and allowing the replication controller recreate the pod which will
pull in the new values on recreation.

In the future the reloading of configuration may be possible without recreating
the pod, once Kubernetes supports changing out these values at runtime and
supports signalling containers, but this is out of the scope of this proposal.

By using jobs to handle bootstrapping tectonic-identity and tectonic-console
we can also provide a better user experience than large amounts of pods crash
looping, and directly communicates the intent. Having many "expected crash
loops" in the existing system makes it very difficult to determine if things
are crashing as expected, or crashing unexpectedly.

Tectonic-manager would then be a simple docker container which has these
Kubernetes manifests in it's docker image.  The manifests being completely
static in the docker image means tectonic-manager's only responsibility would
be to submit the resources to the Kubernetes API.

It will also attempt to create the Kubernetes jobs after it's been able to
verify the services the job will be using are ready and healthy to reduce the
chance that a job runs before the service is listening. An example of this is
the `set-connectors` job will be created after tectonic-manager is able to
verify dex is running by using Kubernetes health checks, rather than having the
job fail to connect to dex and retry. This is mostly an optimization to reduce
noise in the deployment, and is not strictly required, but should be
considered.

### Implementation Details

There will be some small behavioral changes in how tectonic-manager works today
and how it should work after this redesign. The main changes are that
the tectonic-deployer-config may no longer be necessary. Instead we can use
secrets and configMaps directly, or tectonic-manager can take a configuration
file similar to tectonic-deployer-config and produce these manifests. This
is effectively what the new Tectonic Installer will be doing, except through
a web based UI. We may prefer to require the user uses the Installer to produce
these new secrets and configMap files.

Other changes are that the admin user's password will no longer be
automatically generated, instead the user will provide the admin password
to the Installer which will include the user's password in one of the required
secrets manifests.

## Current Status of Implementation

All of the above is currently implemented in the `./dev/spin` script, and
should work as expected. Many values are hard-coded, such as TLS, or the
admin user/password. These can all be replaced, but the current values are
known and working. The user for console is `admin@tectonic.com` and the
password is `theadminpassword`. Currently due to the simplification of this
tectonic-manager is actually unneeded for this POC with the spin script.

## Next Steps

Moving the logic in the `spin` script into tectonic-manager itself. Because
tectonic-manager is becoming significantly simpler it's only job will
effectively to do what the `spin` script does in the POC; that is to create
Kubernetes resources from manifests inside of the container's file system in
the proper order, and to perform health checks on components before creating
jobs to boostrap console and identity to ensure the jobs are likely to succeed
without any failures. A nice side effect is that now, tectonic-manager can
completely replace our `spin` script, meaning less difference in how we deploy
in dev and how our customers deploy.

