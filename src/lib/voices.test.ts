import { describe, expect, it } from "vitest";
import { matchSpokenChoice, normalizeSpoken, pickVoice } from "./voices";

describe("pickVoice", () => {
  it("prefers natural and premium voices over basic ones", () => {
    const voices = [
      { name: "Albert", lang: "en-US", localService: true },
      { name: "Fred", lang: "en-US", localService: true },
      { name: "Samantha", lang: "en-US", localService: true },
      { name: "Ava (Premium)", lang: "en-US", localService: true },
    ];
    expect(pickVoice(voices, "en-US")?.name).toBe("Ava (Premium)");
  });

  it("prefers Edge's natural online voices and Chrome's Google voices", () => {
    expect(pickVoice([{ name: "Microsoft David - English (United States)", lang: "en-US", localService: true }, { name: "Microsoft Aria Online (Natural) - English (United States)", lang: "en-US", localService: false }], "en-US")?.name).toContain("Aria");
    expect(pickVoice([{ name: "Eddy (English (US))", lang: "en-US", localService: true }, { name: "Google US English", lang: "en-US", localService: false }], "en-US")?.name).toBe("Google US English");
  });

  it("never picks a novelty voice when anything else exists, and uses the right language", () => {
    const voices = [
      { name: "Bubbles", lang: "en-US" },
      { name: "Grandma (English (US))", lang: "en-US" },
      { name: "Monica", lang: "es-ES" },
      { name: "Thomas", lang: "fr_FR" },
    ];
    expect(pickVoice(voices, "en-US")?.name).toBe("Grandma (English (US))");
    expect(pickVoice(voices, "es-ES")?.name).toBe("Monica");
    expect(pickVoice(voices, "fr-FR")?.name).toBe("Thomas");
  });

  it("returns null when the device has no voice for the language", () => {
    expect(pickVoice([{ name: "Alex", lang: "en-US" }], "fr-FR")).toBeNull();
  });
});

describe("spoken answers", () => {
  it("normalizes accents, punctuation, emoji and articles", () => {
    expect(normalizeSpoken("¡El Perro! 🐶")).toBe("perro");
    expect(normalizeSpoken("L'école")).toBe("ecole");
    expect(normalizeSpoken("Très bien")).toBe("tres bien");
  });

  it("matches a spoken word to exactly one choice, trying each alternative", () => {
    const choices = ["uno", "dos", "tres", "cuatro"];
    expect(matchSpokenChoice(["tres"], choices)).toBe(2);
    expect(matchSpokenChoice(["trace", "tres"], choices)).toBe(2);
    expect(matchSpokenChoice(["it is dos"], choices)).toBe(1);
    expect(matchSpokenChoice(["cinco"], choices)).toBeNull();
  });

  it("refuses to guess when a phrase matches more than one choice", () => {
    expect(matchSpokenChoice(["buenos dias buenas noches"], ["buenos dias", "buenas noches"])).toBeNull();
  });
});
