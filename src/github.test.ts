import { pretty } from "./github";

test("pretty", () => {
  const log = jest.fn();
  jest.spyOn(console, "log").mockImplementation(log);

  const res = { status: 201, url: "http://example.com", data: { foo: "bar" } };

  console.log(pretty(res));

  expect(log).toHaveBeenCalledWith(
    JSON.stringify({ status: 201, url: "http://example.com" })
  );
});
