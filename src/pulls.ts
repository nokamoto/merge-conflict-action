import * as github from "@actions/github";

interface repo {
  token: string;
  owner: string;
  repo: string;
}

interface pull {
  number: number;
  mergeable_state: string;
}

export async function listPulls({ token, owner, repo }: repo): Promise<pull[]> {
  const octokit = github.getOctokit(token);

  return octokit.rest.pulls
    .list({
      owner: owner,
      repo: repo,
    })
    .then((res) => {
      console.log(JSON.stringify(res));
      return res.data.map((p) => {
        return { number: p.number, mergeable_state: "" };
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
      console.log(JSON.stringify(res));
      return {
        number: res.data.number,
        mergeable_state: res.data.mergeable_state,
      };
    });
}

export async function listMergeConflictPulls(repo: repo): Promise<pull[]> {
  const pulls = await listPulls(repo);

  const conflictingPulls: pull[] = [];
  for (let i = 0; i < pulls.length; i++) {
    const p = await getPull(repo, pulls[i].number);

    console.log(JSON.stringify(p));

    switch (p.mergeable_state) {
      case "dirty":
        conflictingPulls.push({
          number: p.number,
          mergeable_state: p.mergeable_state,
        });
        break;
    }
  }

  return conflictingPulls;
}
