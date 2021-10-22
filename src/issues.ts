import * as github from "@actions/github";
import { repo, pull } from "./github";

async function createIssueComment(
  { token, owner, repo }: repo,
  issue_number: number,
  body: string
): Promise<void> {
  const octokit = github.getOctokit(token);

  return octokit.rest.issues
    .createComment({
      owner: owner,
      repo: repo,
      issue_number: issue_number,
      body: body,
    })
    .then((res) => {
      console.log(JSON.stringify(res));
      return;
    });
}

export async function createIssueComments(
  repo: repo,
  pulls: pull[],
  body: string,
  dryrun: boolean
): Promise<void> {
  for (let i = 0; i < pulls.length; i++) {
    if (dryrun) {
      console.log("[dryrun]", "createIssueComment =", JSON.stringify(pulls[i]));
      continue;
    }
    await createIssueComment(repo, pulls[i].number, body);
  }
}
