import * as core from "@actions/core";
import { createIssueComments, filterPulls } from "./issues";
import { listMergeConflictPulls } from "./pulls";

export async function run(): Promise<void> {
  try {
    const repo = {
      token: core.getInput("token"),
      owner: core.getInput("owner"),
      repo: core.getInput("repo"),
    };
    const body = core.getInput("body");
    const dryrun = core.getBooleanInput("dryrun");

    console.log(
      "repo =",
      JSON.stringify(repo),
      ", body =",
      body,
      ", dryrun =",
      dryrun
    );

    const pulls = await listMergeConflictPulls(repo);

    console.log("pulls =", pulls);

    const filtered = await filterPulls(repo, pulls, body);

    await createIssueComments(repo, filtered, body, dryrun);

    console.log("done");
  } catch (error) {
    console.log(error);
    if (error instanceof Error) core.setFailed(error.message);
    else core.setFailed("unknown: " + JSON.stringify(error));
  }
}
