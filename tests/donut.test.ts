import "../db/create"; // the table the tests use, in this folder's data.sqlite
import { expect, test } from "bun:test";
import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import { currentMembers } from "../util/donut";
import { ICEBREAKERS, randomIcebreaker } from "../util/icebreakers";

const unknownMember = new DiscordAPIError({ code: RESTJSONErrorCodes.UnknownMember, message: "Unknown Member" }, RESTJSONErrorCodes.UnknownMember, 404, "GET", "/x", {});
const fakeChannel: any = { guild: { members: { fetch: async (id: string) => {
  if (id === "left") throw unknownMember;
  if (id === "flaky") throw new Error("socket hang up");
  return { id };
} } } };

test("people who left are dropped; other errors keep them", async () => {
  expect(await currentMembers(fakeChannel, ["here", "left", "flaky"])).toEqual(["here", "flaky"]);
});

test("icebreakers are real questions", () => {
  expect(ICEBREAKERS).toContain(randomIcebreaker());
  expect(ICEBREAKERS.every((q) => q.endsWith("?"))).toBe(true);
});
