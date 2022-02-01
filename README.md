# cdn-configuration

## Overview

This repo stores the AMP versions that are being served by AMP CDNs in [`configs/versions.json`](./configs/versions.json). It also hosts the deployment and patching workflows for the release on-duty engineer[^note].

The following AMP CDNs are managed by this repository:

- [`ampjs.org`](https://ampjs.org) (OpenJS Foundation owned, Cloudflare hosted)
- [`cdn.ampproject.org`](https://cdn.ampproject.org) (Google owned and hosted)

This README contains instructions for the releases on-duty engineer. To learn more about AMP releases, please see release documation at https://github.com/ampproject/amphtml/tree/main/docs.

[^note]: These workflows replace the actions on the internal release dashboard as part of the transition to open source.

## Deploying and promoting a release

Nightly releases are cut, built and deployed automatically.

Releases are promoted to channels by updating [`configs/versions.json`](./configs/versions.json) in a PR. These PRs are created on a schedule and assigned to the on-duty engineer, to be approved and merged.

Once merged, the CDNs will pick up the new versions. It takes about 15-30 minutes for [`cdn.ampproject.org`](https://cdn.ampproject.org) to take effect, and about 1 minute for [`ampjs.org`](https://ampjs.org).

As a summary, promotions run on a weekly schedule:

- Monday: `nightly`, `lts`\*
- Tuesday: `nightly`, `stable`, `beta/experimental opt-in`
- Wednesday: `nightly`, `beta/experimental traffic`
- Thursday: `nightly`
- Friday: `nightly`
- Saturday: none
- Sunday: none

_\*lts promotions occur every 2nd Monday of the month._

For more information about schedules and channels, see https://github.com/ampproject/amphtml/blob/main/docs/release-schedule.md.

## Cherry-picking a release

To cherry-pick a release, run the [`Cherry-pick a release`](https://github.com/ampproject/cdn-configuration/actions/workflows/cherry-pick.yml) workflow. It asks for the AMP version to fix, as well as the commit shas to cherry-pick. For multiple commits, separate the shas with a space.

How it works: the workflow pushes a new branch to amphtml. CircleCI will pick up that branch and build the release. Once built and uploaded to [`ampjs.org`](https://ampjs.org), the CircleCI job will trigger the promote workflow.

It takes about 30 minutes from triggering the cherry-pick to creating a promote PR. The PR should promote the cherry-picked AMP version in all the channels that had the faulty AMP version. To complete the cherry-pick, approve and merge the PR.

Like regular promotions, it takes about 1 minute once merged for [`ampjs.org`](https://ampjs.org) to begin serving the patched release. However, [`cdn.ampproject.org`](https://cdn.ampproject.org) takes between 30 and 90 minutes.

To resolve merge conflicts, cherry-pick the release locally:

1. check out the tag: `git checkout ${amp_version}`
2. switch to a new branch: `git switch -c amp-release-${amp_version}-fix`  
   _(make sure that the branch starts with `amp-release-`)_
3. cherry-pick the fix: `git cherry-pick -x ${shas}`  
   _(make sure to include the `-x` flag)_
4. resolve any merge conflicts
5. push branch to remote: `git push https://github.com/ampproject/amphtml.git`

## Rolling back a release

To roll back a release, find the promote PR and revert it. Do not modify [`configs/versions.json`](./configs/versions.json) manually.

Like regular promotions, it should take between 15-30 minutes for the roll back to take effect on [`cdn.ampproject.org`](https://cdn.ampproject.org), and 1 minute on [`ampjs.org`](https://ampjs.org).

## Workflow failures

If any of the workflows fail, the on-duty engineer will be notified by a GitHub issue. Please resolve the failures in order to stick to the promotion schedule as close as possible.

Promotion workflows can be triggered manually from the [Actions](https://github.com/ampproject/cdn-configuration/actions) tab on this repository. A successful run will result in a PR.

## Permissions

To request access to this repo, reach out to [`@ampproject/wg-infra`](https://github.com/orgs/ampproject/teams/wg-infra).
