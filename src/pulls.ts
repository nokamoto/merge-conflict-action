import * as github from "@actions/github";
import { repo, pull, pretty } from "./github";

export async function listPulls({
  token,
  owner,
  repo,
}: repo): Promise<Omit<pull, "mergeable_state" | "pushed_at" | "labels">[]> {
  const octokit = github.getOctokit(token);

  return octokit.rest.pulls
    .list({
      owner: owner,
      repo: repo,
    })
    .then((res) => {
      console.log(pretty(res));
      return res.data.map((p) => {
        return { number: p.number };
      });
    });
}

async function getPull(
  { token, owner, repo }: repo,
  number: number
): Promise<pull> {
  const octokit = github.getOctokit(token);

  return octokit.rest.pulls
    .get({
      owner: owner,
      repo: repo,
      pull_number: number,
    })
    .then((res) => {
      console.log(pretty(res));
      return {
        number: res.data.number,
        mergeable_state: res.data.mergeable_state,
        labels: res.data.labels,
        pushed_at: res.data.head.repo?.pushed_at,
      };
    });
}

export async function exponentialBackoff(retries: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.min(10, 1 * 2 ** retries) * 1000)
  );
}

export async function listMergeConflictPulls(
  repo: repo,
  unknownStateMaxRetries: number,
  sleep: (retries: number) => Promise<void>,
  options?: { ignoreLabel?: string }
): Promise<pull[]> {
  const pulls = await listPulls(repo);

  const conflictingPulls: pull[] = [];
  for (let i = 0; i < pulls.length; i++) {
    const expbackoff = async (retries: number) => {
      if (retries > unknownStateMaxRetries) {
        console.log("exceed max trial");
        return;
      }
      if (retries != 0) {
        await sleep(retries);
      }

      const p = await getPull(repo, pulls[i].number);
      console.log(JSON.stringify(p));

      if (options?.ignoreLabel && p.labels.some((label) => label.name === options.ignoreLabel)) {
        console.log(`ignore ${options.ignoreLabel} label pull request`);
        return;
      }

      switch (p.mergeable_state) {
        case "dirty":
          conflictingPulls.push(p);
          break;

        case "unknown":
          await expbackoff(retries + 1);
          break;
      }
    };

    await expbackoff(0);
  }

  return conflictingPulls;
}
