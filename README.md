# merge-conflict-action
Github Action to notify merge conflict pulls 

## Usage
```yaml
name: Notify merge conflict pulls

on:
  push:
    branches:
    - main

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: nokamoto/merge-conflict-action@v0.0.2
        with:
          owner: nokamoto
          repo: merge-conflict-action
          token: ${{ secrets.GITHUB_TOKEN }}
```

| inputs | description | required | default |
| --- | --- | --- | --- |
| owner | A string identifier of the owner to retrieve merge conflict pulls. | true | |
| repo | A string identifier of the repository to retrieve merge conflict pulls. | true | |
| token | A string token to authenticate to Github. | true | |
| body | A string body to create issue comments. | false | `"Merge Conflict found"` |
| dryrun | A boolean to indicate whether the action creates actual issue comments. | false | `"false"` |

## How does it works?
```mermaid
sequenceDiagram
    autonumber

    actor dev as Developer
    participant github as Github
    participant action as merge-conflict-action

    dev ->> github : Merge pull
    github ->> action : on.push.branches.main (body, dryrun)
    action ->> github : pulls.list (state = open, sort = created, direction = desc, per_page = 30)
    github ->> action : pulls (number)

    loop for each pulls
        loop do while mergeable_state == "unknown"
            action ->> action : exponential backoff
            action ->> github : pulls.get
            github ->> action : pull (mergeable_state, pushed_at)
        end
        alt mergeable_state != "dirty"
            action ->> action : drop
        end
    end

    loop for each pulls
        action ->> github : issues.listComments
        github ->> action : comments (body', created_at)
        alt exists body == body' and created_at > pushed_at
            action ->> action : drop
        end
    end

    loop for each pulls
        alt dryrun == false
            action ->> github : isssues.createComment (body)
            github ->> dev : Notify merge conflict pulls <br> via issue comments subscription <br> (e.g. Slack /github subscribe)
        end
    end
```

- [pulls.list](https://docs.github.com/en/rest/reference/pulls#list-pull-requests)
- [pulls.get](https://docs.github.com/en/rest/reference/pulls#get-a-pull-request)
- [issues.listComments](https://docs.github.com/en/rest/reference/issues#list-issue-comments)
- [issues.createComment](https://docs.github.com/en/rest/reference/issues#create-an-issue-comment)

## Build

```bash
npm run all
```

Test, lint, format, and build `dist/index.js`.

### Release

Manual. Use the Github release web interface with auto-generate release notes.
