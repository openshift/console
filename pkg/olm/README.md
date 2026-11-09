# OLM migration rollback authorization

Rollback runs under a bounded service-account credential issued by the user who
confirmed recovery. It continues without an authenticated browser and resumes
from Kubernetes checkpoints after a Console backend restart. Console service
credentials cannot renew this credential or expand its permissions.

A ClusterObjectDeployment can create revision names after rollback permissions
are prepared. For deployment-managed recovery, the worker receives revision
delete access together with an API-server admission restriction. The persistent
ValidatingAdmissionPolicy and ValidatingAdmissionPolicyBinding are both named
`console-olm-migration-rollback-v1`.

The policy applies only to Console migration service accounts. For every revision
deletion, it checks whether that account is authorized to delete the exact
ClusterExtension named by the revision's immutable `spec.group`. Legacy revisions
without a group use their owner-name label or initial revision name. The worker's
ClusterExtension delete grant remains restricted to the recovery target. Console
also verifies execution ownership and UIDs before deleting targets and restoring
Classic management.

The admission restriction does not establish ownership identity. A stolen worker
credential can bypass Console's in-process UID checks and delete a preexisting
revision whose group matches the delegated target, even if its owner UID differs.
Admission-policy/API-server and security owners must review this authorization
boundary before merge. Group-name authorization alone must not be described as
equivalent to a deployment-UID restriction. Narrowing the grant must also account
for revisions created after submission and for owner references removed during
orphan deletion, without depending on the submitting browser returning.

The submitting user must be authorized to create the policy and binding if they
are missing, or read them if already installed. The user must also be able to
delegate revision deletion and create an empty revision for an admission probe.
Kubernetes performs its normal RBAC escalation checks when those grants are
created. Console does not replace an existing policy or binding with a different
configuration.

Before publishing the job, Console uses the worker credential for a server-side
dry-run deletion of the empty probe in an unrelated group. Setup waits for the
policy's specific denial, then removes the probe. A missing, changed, or deleting
policy stops recovery with its checkpoint retained.

Probe cleanup is attempted with the initiating user's client using an independent
timeout, and non-NotFound failures produce a redacted warning. Direct deletion is
not guaranteed when the user delegates through `escalate` without holding revision
delete permission. The empty probe has a Namespace owner reference as a fallback:
Kubernetes garbage collection removes it when the job namespace is deleted after
setup failure or normal job cleanup. Until then, it manages no workloads. The
worker does not receive a grant to delete the probe.

The policy and binding have no job owner and remain after job cleanup. Removing
them while revision-delete grants or usable worker credentials remain would
remove the API-server restriction. They must outlive those grants and credentials.
Legacy recovery without a known deployment retains exact revision-name RBAC.
