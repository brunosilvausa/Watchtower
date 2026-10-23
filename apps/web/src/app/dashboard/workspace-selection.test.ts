import { expect, it } from "vitest";
import { authorizedSelection, workspacePreferenceKey } from "./workspace-selection";
it("restores only an authorized workspace and isolates identity preferences", () => {
  const rows = [{ id: "a", name: "A", role: "owner" }, { id: "b", name: "B", role: "viewer" }];
  expect(authorizedSelection(rows, "b")).toBe("b");
  expect(authorizedSelection(rows, "removed-or-foreign")).toBe("a");
  expect(authorizedSelection([], "b")).toBe("");
  expect(workspacePreferenceKey("user-a")).not.toBe(workspacePreferenceKey("user-b"));
});
