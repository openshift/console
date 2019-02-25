# How to Contribute

This document outlines some of the conventions on development workflow.

## Getting Started

- Fork the repository on GitHub
- Read the [README](README.md) for build and test instructions
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

### Pull Requests Against Other Branches

Pull requests opened against branches other than master should start the pull
request title with the branch name in brackets like `[release-3.11]` to make it
obvious. Include the bug as well when appropriate. For instance,

```
[release-3.11] Bug 1643948: Fix crashlooping pods query
```

If you use the `/cherrypick` command, the bot will automatically append the
branch to the pull request title. For instance, adding a comment to a PR like

```
/cherrypick release-3.11
```

will create a new pull request against the release-3.11 branch when the current
pull request merges as long as there are no merge conflicts.
