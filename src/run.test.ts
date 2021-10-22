import { run } from "./run";
import * as core from "@actions/core";
import * as pulls from "./pulls";
import * as issues from "./issues";

describe("run", () => {
  const dryrun = false;

  const setup = (list: jest.Mock, create: jest.Mock) => {
    const setFailed = jest.fn();
    const log = jest.fn();
    jest.spyOn(core, "getInput").mockImplementation((name) => name);
    jest.spyOn(core, "getBooleanInput").mockImplementation(() => dryrun);
    jest.spyOn(core, "setFailed").mockImplementation(setFailed);
    jest.spyOn(pulls, "listMergeConflictPulls").mockImplementation(list);
    jest.spyOn(issues, "createIssueComments").mockImplementation(create);
    jest.spyOn(console, "log").mockImplementation(log);
    return [setFailed, log];
  };

  test("list merge conflict pulls and create issue comments", async () => {
    const list = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve([{ number: 1, mergeable_state: "dirty" }])
      );
    const create = jest.fn().mockImplementation(() => Promise.resolve());
    const [setFailed, log] = setup(list, create);

    await run();

    expect(setFailed).toHaveBeenCalledTimes(0);
    expect(log).toHaveBeenLastCalledWith("done");

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      token: "token",
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      {
        owner: "owner",
        repo: "repo",
        token: "token",
      },
      [{ number: 1, mergeable_state: "dirty" }],
      "body",
      dryrun
    );
  });

  test("call setFailed if list merge conflict pulls failed", async () => {
    const list = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));
    const create = jest.fn();
    const [setFailed, log] = setup(list, create);

    await run();

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith("failed");

    expect(log).not.toHaveBeenLastCalledWith("done");

    expect(list).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(0);
  });

  test("call setFailed if create issue comments failed", async () => {
    const list = jest.fn().mockImplementation(() => Promise.resolve([]));
    const create = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("failed")));
    const [setFailed, log] = setup(list, create);

    await run();

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith("failed");

    expect(log).not.toHaveBeenLastCalledWith("done");

    expect(list).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
