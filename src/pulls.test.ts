import { listMergeConflictPulls } from "./pulls";
import * as github from "@actions/github";

describe("listMergeConflictPulls", () => {
  const setup = (list: jest.Mock, get: jest.Mock) => {
    const getOctokit = jest.fn().mockImplementation(() => {
      const { GitHub } = jest.requireActual("@actions/github/lib/utils");
      return {
        ...GitHub,
        rest: {
          pulls: { list: list, get: get },
        },
      };
    });

    jest.spyOn(github, "getOctokit").mockImplementation(getOctokit);

    jest.spyOn(console, "log").mockImplementation(() => {
      return;
    });

    return [getOctokit];
  };

  test("list empty", async () => {
    const list = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [],
      })
    );

    const get = jest.fn();

    const [getOctokit] = setup(list, get);

    const actual = await listMergeConflictPulls({
      repo: "repo",
      owner: "owner",
      token: "token",
    });

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({
      repo: "repo",
      owner: "owner",
    });

    expect(get).toHaveBeenCalledTimes(0);

    expect(actual).toEqual([]);
  });

  test("list merge conflict pulls if mergeable_state is dirty", async () => {
    const list = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ number: 1 }, { number: 2 }],
      })
    );

    const get = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            number: 1,
            mergeable_state: "dirty",
            head: { repo: { pushed_at: "2011-01-26T19:06:43Z" } },
          },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { number: 2, mergeable_state: "clean", head: {} },
        })
      );

    const [getOctokit] = setup(list, get);

    const actual = await listMergeConflictPulls({
      repo: "repo",
      owner: "owner",
      token: "token",
    });

    expect(getOctokit).toHaveBeenCalledTimes(3);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({
      repo: "repo",
      owner: "owner",
    });

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, {
      repo: "repo",
      owner: "owner",
      pull_number: 1,
    });
    expect(get).toHaveBeenNthCalledWith(2, {
      repo: "repo",
      owner: "owner",
      pull_number: 2,
    });

    expect(actual).toEqual([
      {
        number: 1,
        mergeable_state: "dirty",
        pushed_at: "2011-01-26T19:06:43Z",
      },
    ]);
  });

  test("error if list failed", async () => {
    const list = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));

    const get = jest.fn();

    const [getOctokit] = setup(list, get);

    await expect(
      listMergeConflictPulls({
        repo: "repo",
        owner: "owner",
        token: "token",
      })
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(0);
  });

  test("error if get failed", async () => {
    const list = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ number: 1 }, { number: 2 }],
      })
    );

    const get = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));

    const [getOctokit] = setup(list, get);

    await expect(
      listMergeConflictPulls({
        repo: "repo",
        owner: "owner",
        token: "token",
      })
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
