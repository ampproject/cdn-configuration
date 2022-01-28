# cdn-configuration

## Overview

This README contains instructions for the releases on-duty engineer. To learn more about AMP releases, please see release documation at (https://github.com/ampproject/amphtml/tree/main/docs)

## About this repo

This repo stores the AMP versions that are being served by the AMP CDN. It also hosts the deployment and patching workflows for the release on-duty engineer.

These workflows replace the actions on the internal release dashboard. It does not, however, replace the error monitoring systems. Please check the internal doc for links to monitor errors and performance.

## Deploying a release (promote)

PRs to update `configs/versions.json` are created on a schedule and assigned to the on-duty engineer. To promote a release, approve and merge the associated PR.

Once merged, the CDNs will automatically pick up the new versions. It should take between 30 to 90 minutes for the PR to take effect.

As a summary, promotions run on a weekly schedule:

- Monday: nightly, lts\*
- Tuesday: nightly, stable, beta/experimental opt-in
- Wednesday: nightly, beta/experimental traffic
- Thursday: nightly
- Friday: nightly
- Saturday: none
- Sunday: none
  \*lts promotions occur every 2nd Monday of the month

If any of the workflows fail, the on-duty will be notified by a GitHub issue. Please resolve the failures in order to stick to the schedule as close as possible.

For more information about schedules and channels, see xx.

## Patching a release (cherry-pick)

To cherry-pick a release, run the `Cherry-pick a release` workflow. It asks for the AMP version to fix, as well as the commit shas to cherry-pick. For multiple commits, separate the shas with a space.

How it works: the workflow pushes a new branch to amphtml. CircleCI will pick up that branch and build the release. Once built and uploaded to `ampjs.org`, the CircleCI job will trigger the promote workflow. A promote PR should be created and assigned to the on-duty engineer in about 30 minutes, which should promote the cherry-picked AMP version in all the channels that had the faulty AMP version. To complete the cherry-pick, approve and merge the PR.

If the workflow fails, the on-duty engineer will be notified by a GitHub issue. To resolve merge conflicts, cherry-pick the release locally:

1. check out the tag: `git checkout ${amp_version}`
2. switch to a new branch: `git switch -c amp-release-${amp_version}-fix`
   (Make sure that the branch starts with `amp-release-`)
3. cherry-pick the fix: `git cherry-pick -x ${shas}`
   (Make sure to include the `-x` flag)
4. resolve any merge conflicts
5. push branch to remote: `git push https://github.com/ampproject/amphtml.git`

## Rolling back a release

To roll back a release, find the promote PR and revert it. Do not modify `configs/versions.json` manually.

Like regular promotions, it should take between 30 to 90 minutes for the PR to take effect.

## Permissions

To request access to this repo, reach out to @ampproject/wg-infra.
