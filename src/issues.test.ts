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

    jest.spyOn(github, "getOctokit").mockImplementation(getOctokit);

    jest.spyOn(console, "log").mockImplementation(() => {
      return;
    });

    return [getOctokit];
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
      "body"
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
        "body"
      )
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(createComment).toHaveBeenCalledTimes(1);
  });
});
