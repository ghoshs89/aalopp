import { describe, expect, it } from "vitest";
import { matchSpokenChoice, normalizeSpoken, pickVoice } from "./voices";

describe("pickVoice", () => {
  const voices = [
    { name: "Alex", lang: "en-US" },
    { name: "Samantha", lang: "en-US" },
    { name: "Jorge", lang: "es-ES" },
    { name: "Paulina", lang: "es-MX" },
    { name: "Thomas", lang: "fr_FR" },
  ];

  it("prefers a friendly voice in the right language", () => {
    expect(pickVoice(voices, "en-US")?.name).toBe("Samantha");
    expect(pickVoice(voices, "es-ES")?.name).toBe("Paulina");
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
