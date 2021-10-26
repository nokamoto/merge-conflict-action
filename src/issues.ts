import * as github from "@actions/github";
import { repo, pull } from "./github";

interface comment {
  body?: string;
  created_at: string;
}

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

async function listIssueComments(
  { token, owner, repo }: repo,
  issue_number: number
): Promise<comment[]> {
  const octokit = github.getOctokit(token);

  return octokit.rest.issues
    .listComments({
      owner: owner,
      repo: repo,
      issue_number: issue_number,
    })
    .then((res) => {
      console.log(JSON.stringify(res));
      return res.data.map((c) => {
        return {
          body: c.body,
          created_at: c.created_at,
        };
      });
    });
}

export async function filterPulls(
  repo: repo,
  pulls: pull[],
  body: string
): Promise<pull[]> {
  const filtered: pull[] = [];
  for (let i = 0; i < pulls.length; i++) {
    const p = pulls[i];
    if (!p.pushed_at) {
      console.log("[pushed_at undefined]", JSON.stringify(p));
      continue;
    }
    const pushed_at = p.pushed_at;

    const comments = await listIssueComments(repo, p.number);
    const forward: (c: comment) => boolean = (c) => {
      if (c.body != body) {
        return false;
      }
      const commentts = Date.parse(c.created_at);
      const pullts = Date.parse(pushed_at);
      return commentts >= pullts;
    };
    if (comments.some(forward)) {
      console.log(
        "[already notified]",
        JSON.stringify(p),
        JSON.stringify(comments)
      );
      continue;
    }

    filtered.push(p);
  }
  return filtered;
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
