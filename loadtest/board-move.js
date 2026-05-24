// k6 baseline scenario: log in once, repeatedly load a board and PATCH the
// first card's title. Mirrors a realistic "user has the board open and is
// editing" pattern — not a CARD_MOVED WS broadcast, because k6 doesn't
// re-use the cookie jar across the HTTP/WS boundary cleanly.
//
// Usage: see loadtest/README.md.

import http from "k6/http";
import { check, sleep, fail } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;
const BOARD_ID = __ENV.BOARD_ID;

if (!EMAIL || !PASSWORD || !BOARD_ID) {
  fail("EMAIL, PASSWORD and BOARD_ID env vars are required");
}

export const options = {
  scenarios: {
    steady: {
      executor: "constant-vus",
      vus: 10,
      duration: "1m",
    },
  },
  thresholds: {
    // Treat regressions past these as failures so CI can gate.
    board_load_latency: ["p(95)<400"],
    card_patch_latency: ["p(95)<250"],
    http_req_failed: ["rate<0.01"],
  },
};

const boardLoadLatency = new Trend("board_load_latency", true);
const cardPatchLatency = new Trend("card_patch_latency", true);

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "login 200": (r) => r.status === 200 }) ||
    fail(`login failed: ${res.status} ${res.body}`);

  const cookieHeader = res.headers["Set-Cookie"] || "";
  // k6 doesn't have an automatic cookie jar across setup→default, so extract
  // the auth_token cookie manually and re-attach it on each request.
  const match = /auth_token=([^;]+)/.exec(cookieHeader);
  if (!match) fail("login response did not set auth_token cookie");
  return { authCookie: `auth_token=${match[1]}` };
}

export default function (data) {
  const headers = {
    "Content-Type": "application/json",
    Cookie: data.authCookie,
  };

  const boardRes = http.get(`${BASE_URL}/api/boards/${BOARD_ID}`, { headers });
  boardLoadLatency.add(boardRes.timings.duration);
  check(boardRes, { "board 200": (r) => r.status === 200 });

  let cardID = null;
  try {
    const cols = boardRes.json();
    for (const col of cols || []) {
      if (col.cards && col.cards.length > 0) {
        cardID = col.cards[0].id;
        break;
      }
    }
  } catch (_) {
    // no-op — leave cardID null and skip the PATCH this iteration
  }

  if (cardID) {
    const patchRes = http.patch(
      `${BASE_URL}/api/cards/${cardID}`,
      JSON.stringify({ title: `loadtest ${Date.now()}` }),
      { headers }
    );
    cardPatchLatency.add(patchRes.timings.duration);
    check(patchRes, { "patch 2xx": (r) => r.status >= 200 && r.status < 300 });
  }

  sleep(1);
}
