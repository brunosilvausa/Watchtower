import { expect, test } from "vitest";
import { filterMonitors } from "./monitor-filter";
const rows = [{ id: "a", name: "API", target: "example.com", type: "http", state: "up", paused: true }, { id: "b", name: "Site", target: "example.com", type: "http", state: "unknown" }, { id: "c", name: "API", target: "api.example.com", type: "api", state: "down" }];
test("combines visible identity, effective status and type without treating unknown as healthy", () => {
  expect(filterMonitors(rows, " EXAMPLE ", "paused", "http").map(row => row.id)).toEqual(["a"]);
  expect(filterMonitors(rows, "", "up", "all")).toEqual([]);
  expect(filterMonitors(rows, "api", "down", "api").map(row => row.id)).toEqual(["c"]);
  expect(filterMonitors(rows, "", "unknown", "all").map(row => row.id)).toEqual(["b"]);
});
