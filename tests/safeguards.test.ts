import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, formatDate, lastDayOfMonth } from "@/lib/dates";
import { en } from "@/lib/i18n/en";
import { createTranslator } from "@/lib/i18n/translate";
import { fallbackMatches, matchCandidates, type PublicProfile } from "@/lib/network";
import { PLACES, isInAzerbaijan, resolveCoordinates } from "@/lib/places";
import { formatAZN } from "@/lib/utils";

// Checks on what the app does when the model returns something wrong or nothing at all.

test("a known place id wins over coordinates invented by the model", () => {
  const place = PLACES.find((item) => item.id === "nizami_street")!;
  assert.deepEqual(resolveCoordinates({ place_id: "nizami_street", lat: 0, lng: 0 }, 0, "Bakı"), {
    lat: place.lat,
    lng: place.lng,
  });
});

test("coordinates outside Azerbaijan are replaced with the user's city", () => {
  const paris = { place_id: null, lat: 48.85, lng: 2.35 };
  const baku = resolveCoordinates(paris, 0, "Bakı, Nəsimi");
  assert.ok(isInAzerbaijan(baku.lat, baku.lng));
  const ganja = resolveCoordinates(paris, 1, "Gəncə");
  assert.ok(Math.abs(ganja.lat - 40.68) < 0.05, "falls back to the Ganja city centre");
});

function profile(id: string, track: PublicProfile["track"], extra: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id,
    full_name: id,
    avatar_url: null,
    track,
    stage: "idea",
    city: "Bakı",
    products: null,
    target_customer: null,
    bio: null,
    looking_for: [],
    ...extra,
  };
}

test("without the AI ranking, matches still come from the user's own and related tracks", () => {
  const me = profile("me", "food");
  const others = [
    profile("clothing", "clothing"),
    profile("same", "food", { looking_for: ["supplier"] }),
    profile("related", "it_services"),
    me,
  ];
  const matches = fallbackMatches(me, matchCandidates(me, others), createTranslator("en"));
  assert.deepEqual(matches.map((match) => match.profile.id), ["same", "related"]);
  assert.equal(matches[0].reason, "You both work in Food, and they are looking for: supplier.");
  assert.ok(matches.every((match) => match.ai === false));
});

test("Azerbaijani is the source text and English is looked up", () => {
  const az = createTranslator("az");
  const english = createTranslator("en");
  assert.equal(az("Daxil ol"), "Daxil ol");
  assert.equal(english("Daxil ol"), "Sign in");
  assert.equal(english("Addım {step} / {total}", { step: 2, total: 7 }), "Step 2 of 7");
  assert.equal(az("İmkanlar##swot"), "İmkanlar");
  assert.equal(english("İmkanlar##swot"), "Opportunities");
  assert.equal(english("Lüğətdə olmayan mətn"), "Lüğətdə olmayan mətn");
});

test("every English text uses only placeholders its Azerbaijani source provides", () => {
  const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  for (const [source, translation] of Object.entries(en)) {
    assert.ok(translation.trim(), `empty translation for "${source}"`);
    // Two sources pass a capitalised and a lower-case form; English uses the capitalised one.
    const provided = new Set([...names(source), ...names(source).map((name) => name.replace(/Lower$/, ""))]);
    for (const name of names(translation)) assert.ok(provided.has(name), `"${source}" has no {${name}}`);
  }
});

test("dates and money are formatted the same on the server and in the browser", () => {
  assert.equal(addMonths("2026-01", -2), "2025-11");
  assert.equal(lastDayOfMonth("2024-02"), "2024-02-29");
  assert.equal(formatDate("2026-10-09"), "9 oktyabr 2026");
  assert.equal(formatDate("2026-10-09T08:00:00Z", createTranslator("en")), "9 October 2026");
  // The separators are non-breaking spaces, so compare with ordinary ones.
  const plain = (amount: number) => formatAZN(amount).replace(/\s/g, " ");
  assert.equal(plain(12400), "12 400 ₼");
  assert.equal(plain(-1250.5), "−1 250,50 ₼");
});
