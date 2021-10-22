import * as github from "@actions/github";
import { createIssueComments } from "./issues";

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
      [
        { number: 1, mergeable_state: "dirty" },
        { number: 2, mergeable_state: "dirty" },
      ],
      "body",
      false
    );

    expect(getOctokit).toHaveBeenCalledTimes(2);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(createComment).toHaveBeenCalledTimes(2);
    expect(createComment).toHaveBeenNthCalledWith(1, {
      repo: "repo",
      owner: "owner",
      issue_number: 1,
      body: "body",
    });
    expect(createComment).toHaveBeenNthCalledWith(2, {
      repo: "repo",
      owner: "owner",
      issue_number: 2,
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
        [
          { number: 1, mergeable_state: "dirty" },
          { number: 2, mergeable_state: "dirty" },
        ],
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
      [
        { number: 1, mergeable_state: "dirty" },
        { number: 2, mergeable_state: "dirty" },
      ],
      "body",
      true
    );

    expect(getOctokit).toHaveBeenCalledTimes(0);
    expect(createComment).toHaveBeenCalledTimes(0);

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(
      1,
      "[dryrun]",
      expect.anything(),
      expect.anything()
    );
    expect(log).toHaveBeenNthCalledWith(
      2,
      "[dryrun]",
      expect.anything(),
      expect.anything()
    );
  });
});
