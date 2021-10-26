import * as github from "@actions/github";
import { createIssueComments, filterPulls } from "./issues";

describe("createIssueComments", () => {
  const setup = (createComment: jest.Mock) => {
    const getOctokit = jest.fn().mockImplementation(() => {
      const { GitHub } = jest.requireActual("@actions/github/lib/utils");
      return {
        ...GitHub,
        rest: {
          issues: { createComment: createComment },
        },
      };
    });

    const log = jest.fn();

    jest.spyOn(github, "getOctokit").mockImplementation(getOctokit);

    jest.spyOn(console, "log").mockImplementation(log);

    return [getOctokit, log];
  };

  test("create comments", async () => {
    const createComment = jest.fn().mockImplementation(() => Promise.resolve());

    const [getOctokit] = setup(createComment);

    await createIssueComments(
      { repo: "repo", owner: "owner", token: "token" },
      [{ number: 1, mergeable_state: "dirty" }],
      "body",
      false
    );

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(createComment).toHaveBeenCalledTimes(1);
    expect(createComment).toHaveBeenNthCalledWith(1, {
      repo: "repo",
      owner: "owner",
      issue_number: 1,
      body: "body",
    });
  });

  test("error if create comments failed", async () => {
    const createComment = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));

    const [getOctokit] = setup(createComment);

    await expect(
      createIssueComments(
        { repo: "repo", owner: "owner", token: "token" },
        [{ number: 1, mergeable_state: "dirty" }],
        "body",
        false
      )
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(createComment).toHaveBeenCalledTimes(1);
  });

  test("skip to create comments if dryrun is true", async () => {
    const createComment = jest.fn();

    const [getOctokit, log] = setup(createComment);

    await createIssueComments(
      { repo: "repo", owner: "owner", token: "token" },
      [{ number: 1, mergeable_state: "dirty" }],
      "body",
      true
    );

    expect(getOctokit).toHaveBeenCalledTimes(0);
    expect(createComment).toHaveBeenCalledTimes(0);

    expect(log).toHaveBeenCalledWith(
      "[dryrun]",
      expect.anything(),
      expect.anything()
    );
  });
});

describe("filterPulls", () => {
  const setup = (listComments: jest.Mock) => {
    const getOctokit = jest.fn().mockImplementation(() => {
      const { GitHub } = jest.requireActual("@actions/github/lib/utils");
      return {
        ...GitHub,
        rest: {
          issues: { listComments: listComments },
        },
      };
    });

    const log = jest.fn();

    jest.spyOn(github, "getOctokit").mockImplementation(getOctokit);

    jest.spyOn(console, "log").mockImplementation(log);

    return [getOctokit, log];
  };

  test("do not filter pulls if no issue comments", async () => {
    const listComments = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [],
      })
    );

    const [getOctokit] = setup(listComments);

    const actual = await filterPulls(
      { owner: "owner", repo: "repo", token: "token" },
      [
        {
          number: 1,
          mergeable_state: "dirty",
          pushed_at: "2011-01-26T19:06:43Z",
        },
      ],
      "body"
    );

    expect(actual).toEqual([
      {
        number: 1,
        mergeable_state: "dirty",
        pushed_at: "2011-01-26T19:06:43Z",
      },
    ]);

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(listComments).toHaveBeenCalledTimes(1);
    expect(listComments).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 1,
    });
  });

  test("filter pulls if created_at > pushed_at", async () => {
    const listComments = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ body: "body", created_at: "2011-01-27T19:06:43Z" }],
      })
    );

    const [getOctokit] = setup(listComments);

    const actual = await filterPulls(
      { owner: "owner", repo: "repo", token: "token" },
      [
        {
          number: 1,
          mergeable_state: "dirty",
          pushed_at: "2011-01-26T19:06:43Z",
        },
      ],
      "body"
    );

    expect(actual).toEqual([]);

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(listComments).toHaveBeenCalledTimes(1);
  });

  test("do not filter pulls if created_at < pushed_at", async () => {
    const listComments = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ body: "body", created_at: "2011-01-25T19:06:43Z" }],
      })
    );

    const [getOctokit] = setup(listComments);

    const actual = await filterPulls(
      { owner: "owner", repo: "repo", token: "token" },
      [
        {
          number: 1,
          mergeable_state: "dirty",
          pushed_at: "2011-01-26T19:06:43Z",
        },
      ],
      "body"
    );

    expect(actual).toEqual([
      {
        number: 1,
        mergeable_state: "dirty",
        pushed_at: "2011-01-26T19:06:43Z",
      },
    ]);

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(listComments).toHaveBeenCalledTimes(1);
  });

  test("do not filter pulls if created_at > pushed_at but body != body_text", async () => {
    const listComments = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ body: "!= body", created_at: "2011-01-27T19:06:43Z" }],
      })
    );

    const [getOctokit] = setup(listComments);

    const actual = await filterPulls(
      { owner: "owner", repo: "repo", token: "token" },
      [
        {
          number: 1,
          mergeable_state: "dirty",
          pushed_at: "2011-01-26T19:06:43Z",
        },
      ],
      "body"
    );

    expect(actual).toEqual([
      {
        number: 1,
        mergeable_state: "dirty",
        pushed_at: "2011-01-26T19:06:43Z",
      },
    ]);

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(listComments).toHaveBeenCalledTimes(1);
  });
});
