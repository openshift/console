# How to Contribute

This document outlines some of the conventions on development workflow.

## Getting Started

- Fork the repository on GitHub
- Read the [README](README.md) for build and test instructions
- Read the [STYLEGUIDE](STYLEGUIDE.md) for code conventions
- Play with the project, submit bugs, submit patches!

## Contribution Flow

This is a rough outline of what a contributor's workflow looks like:

- Create a topic branch from where you want to base your work (usually master).
- Make commits of logical units.
- Make sure your commit messages are in the proper format (see below).
- Push your changes to a topic branch in your fork of the repository.
- Make sure the tests pass, and add any new tests as appropriate.
- Submit a pull request to the original repository.


### Format of the Commit Message

We follow a rough convention for commit messages that is designed to answer two
questions: what changed and why. The subject line should feature the what and
the body of the commit should describe the why.

```
Add the test-cluster command

This uses tmux to setup a test cluster that you can easily kill and
start for debugging.
```

Commits that fix a Bugzilla bug should add the bug number like `Bug 12345: ` to
the first line of the commit and to the pull request title. To help others
quickly go to the bug, also add a link to the bug in the body of the commit
message. This allows automated tooling to generate links to bugs in release
notes and will eventually allow us to automatically transition bugs to `ON_QA`
when the fix is available in a nightly build. Here's an example commit message
for a change that fixes a Bugzilla bug:

```
Bug 1679272: Validate console can talk to OAuth token URL

Make sure we can successfully talk to the OAuth token URL after
discovering metadata before marking the console pod as ready.

Fixes https://bugzilla.redhat.com/show_bug.cgi?id=1679272
```

Pull requests that close GitHub issues should add text to the pull request
description in the format `Closes #123`. GitHub will automatically link each
issue to its pull request and close the issue when the pull request merges.

While we don't have automated tooling for JIRA issues, you should still include
a link to the issue in the commit description to make it easy to get to the issue.

### Backporting Fixes

Branches for previous releases follow the format `release-X.Y`, for example,
`release-4.1`. Typically, bugs are fixed in the master branch first then
backported to the appropriate release branches. Fixes backported to previous
releases should have a Bugzilla bug for each version fixed.

You can use the `/cherrypick` command to ask the bot to backport a fix.

```
/cherrypick release-4.1
```

will create a new pull request against the release-4.1 branch when the current
pull request merges as long as there are no merge conflicts.
