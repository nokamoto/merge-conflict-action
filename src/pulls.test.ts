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

    const sleep = jest.fn().mockImplementation(() => Promise.resolve());

    jest.spyOn(github, "getOctokit").mockImplementation(getOctokit);

    jest.spyOn(console, "log").mockImplementation(() => {
      return;
    });

    return [getOctokit, sleep];
  };

  test("list empty", async () => {
    const list = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [],
      })
    );

    const get = jest.fn();

    const [getOctokit, sleep] = setup(list, get);

    const actual = await listMergeConflictPulls(
      {
        repo: "repo",
        owner: "owner",
        token: "token",
      },
      0,
      sleep
    );

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(sleep).toBeCalledTimes(0);

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

    const [getOctokit, sleep] = setup(list, get);

    const actual = await listMergeConflictPulls(
      {
        repo: "repo",
        owner: "owner",
        token: "token",
      },
      0,
      sleep
    );

    expect(getOctokit).toHaveBeenCalledTimes(3);
    expect(getOctokit).toHaveBeenCalledWith("token");

    expect(sleep).toBeCalledTimes(0);

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

  test("retry if mergeable_state is unknown", async () => {
    const list = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: [{ number: 1 }],
      })
    );

    const get = jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: {
          number: 1,
          mergeable_state: "unknown",
          head: { repo: { pushed_at: "2011-01-26T19:06:43Z" } },
        },
      })
    );

    const [getOctokit, sleep] = setup(list, get);

    const actual = await listMergeConflictPulls(
      {
        repo: "repo",
        owner: "owner",
        token: "token",
      },
      1,
      sleep
    );

    expect(getOctokit).toHaveBeenCalledTimes(3);
    expect(list).toHaveBeenCalledTimes(1);

    expect(sleep).toBeCalledTimes(1);

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, {
      repo: "repo",
      owner: "owner",
      pull_number: 1,
    });
    expect(get).toHaveBeenNthCalledWith(2, {
      repo: "repo",
      owner: "owner",
      pull_number: 1,
    });

    expect(actual).toStrictEqual([]);
  });

  test("error if list failed", async () => {
    const list = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));

    const get = jest.fn();

    const [getOctokit, sleep] = setup(list, get);

    await expect(
      listMergeConflictPulls(
        {
          repo: "repo",
          owner: "owner",
          token: "token",
        },
        0,
        sleep
      )
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(1);
    expect(sleep).toBeCalledTimes(0);
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

    const [getOctokit, sleep] = setup(list, get);

    await expect(
      listMergeConflictPulls(
        {
          repo: "repo",
          owner: "owner",
          token: "token",
        },
        0,
        sleep
      )
    ).rejects.toThrow("failed");

    expect(getOctokit).toHaveBeenCalledTimes(2);
    expect(sleep).toBeCalledTimes(0);
    expect(list).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
