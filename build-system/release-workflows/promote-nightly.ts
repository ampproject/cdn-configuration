"use strict";

import {
  createVersioningUpdatePullRequest,
  runPromoteJob,
} from "./promote-job";

/**
 * @fileoverview Script that promotes the latest nightly release.
 */

const jobName = "promote-nightly.js";
const { AMP_VERSION } = process.env;

runPromoteJob(jobName, async () => {
  // TODO(danielrozenberg): add safety check that this version exists on the CDN.

  await createVersioningUpdatePullRequest(() => ({
    versioningChanges: { nightly: `04${AMP_VERSION}` },
    title: `⏫🌙 Promoting release ${AMP_VERSION} to Nightly channel`,
    body: `Promoting release ${AMP_VERSION} to Nightly channel`,
  }));
});
