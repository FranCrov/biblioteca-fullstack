import { describe, expect, it } from "vitest";
import { buildSocialProviders } from "../src/lib/auth.js";

describe("social provider configuration", () => {
  it("enables GitHub and Google when both credentials are configured", () => {
    expect(
      buildSocialProviders({
        githubClientId: "gh-id",
        githubClientSecret: "gh-secret",
        googleClientId: "go-id",
        googleClientSecret: "go-secret",
      }),
    ).toEqual({
      github: { clientId: "gh-id", clientSecret: "gh-secret" },
      google: { clientId: "go-id", clientSecret: "go-secret" },
    });
  });

  it("omits providers with incomplete credentials", () => {
    expect(
      buildSocialProviders({
        githubClientId: "gh-id",
        googleClientSecret: "go-secret",
      }),
    ).toEqual({});
  });
});
