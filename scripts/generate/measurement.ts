import { COIN_VALUES_CENTS, type Question } from "../../src/content/schema";
import { addMinutes, assert, choices, dollars, numeric, question, timeLabel, type Draft } from "./helpers";

const FILE = "measurement.ts";

function clockBasics(): Draft[] {
  const hours: [string, number, string][] = [
    ["mdh-breakfast-seven", 7, "Breakfast is at the time on this clock. What time is it?"],
    ["mdh-noon-lunch", 12, "Lunch is at the time on this clock. What time is it?"],
    ["mdh-soccer-nine", 9, "The soccer game starts at the time on this clock. What time is it?"],
    ["mdh-hands-six", 6, "The short hand points to 6 and the long hand points to 12. What time is it?"],
  ];
  const drafts: Draft[] = hours.map(([id, h, prompt]) => ({
    id,
    skills: ["MATH-MD-TIME-HOUR"],
    prompt,
    visual: { kind: "clock", hour: h, minute: 0 },
    answer: choices(id, `${h} o'clock`, [`12:${String(h).padStart(2, "0")}`, `${h === 12 ? 1 : h + 1} o'clock`, `${h === 1 ? 12 : h - 1} o'clock`]),
    explanation: `The short hand tells the hour, and it points to ${h}. The long hand points straight up to 12, which means exactly on the hour. It is ${h} o'clock.`,
    band: 1,
  }));
  const halves: [string, number, number, string, string][] = [
    ["mdq-half-past-eleven", 11, 30, "11:30", "The race starts at half past the hour. What time does the clock show?"],
    ["mdq-quarter-past-six", 6, 15, "6:15", "Dinner is at the time on this clock. What time is it?"],
    ["mdq-quarter-to-four", 3, 45, "3:45", "Soccer practice ends at the time on this clock. What time is it?"],
  ];
  for (const [id, h, m, label, prompt] of halves) {
    const next = h === 12 ? 1 : h + 1;
    const word = m === 30 ? "half past" : m === 15 ? "quarter past" : `quarter to ${next}`;
    drafts.push({
      id,
      skills: ["MATH-MD-TIME-HALF-QUARTER"],
      prompt,
      visual: { kind: "clock", hour: h, minute: m },
      answer: choices(id, label, [timeLabel(next, m), timeLabel(h, m / 5), timeLabel(h, (m + 15) % 60)]),
      explanation:
        m === 45
          ? `The long hand points to 9, which is 45 minutes. The short hand is almost at ${next} but has not reached it, so the hour is still ${h}. It is ${label}, which people also call quarter to ${next}.`
          : `The long hand points to ${m / 5}, which is ${m} minutes. The short hand is ${m === 30 ? "halfway between" : "just past"} ${h}${m === 30 ? ` and ${next}` : ""}, so the hour is ${h}. It is ${label}, or ${word} ${h}.`,
      band: m === 45 ? 3 : 2,
    });
  }
  return drafts;
}

function timeToFiveMinutes(): Draft[] {
  const items: [string, number, number, string][] = [
    ["md5-pit-stop", 2, 25, "The pit stop crew starts work at the time on this clock. What time is it?"],
    ["md5-soccer-practice", 7, 50, "Soccer practice starts at the time on this clock. What time does it start?"],
    ["md5-car-show-doors", 10, 5, "The doors of the car show open at this time. What time do they open?"],
    ["md5-chess-club", 4, 40, "Chess club begins at the time on this clock. What time is it?"],
    ["md5-bus-arrives", 11, 35, "The school bus arrives at the time on this clock. What time does it arrive?"],
    ["md5-race-finish", 8, 55, "The last race car crosses the finish line at this time. What time is it?"],
  ];
  return items.map(([id, h, m, prompt]) => {
    const pointsAt = m / 5;
    const nextHour = h === 12 ? 1 : h + 1;
    const prevHour = h === 1 ? 12 : h - 1;
    const distractors = [
      timeLabel(h, pointsAt), // reads the number under the long hand as minutes
      m >= 30 ? timeLabel(nextHour, m) : timeLabel(prevHour, m), // hour hand confusion
      timeLabel(pointsAt === 0 ? 12 : pointsAt, (h * 5) % 60), // swaps the hands
      timeLabel(h, (m + 5) % 60),
    ];
    const count = Array.from({ length: pointsAt }, (_, i) => (i + 1) * 5).join(", ");
    const hourNote =
      m >= 30
        ? `The short hand is past ${h} and moving toward ${nextHour}, but it has not reached ${nextHour} yet, so the hour is still ${h}.`
        : `The short hand is just past ${h}, so the hour is ${h}.`;
    return {
      id,
      skills: ["MATH-MD-TIME-5MIN"],
      prompt,
      visual: { kind: "clock", hour: h, minute: m },
      answer: choices(id, timeLabel(h, m), distractors),
      explanation: `The long hand points to ${pointsAt}. Count by fives for each number: ${count}. That is ${m} minutes. ${hourNote} It is ${timeLabel(h, m)}.`,
      band: m >= 30 ? 3 : 2,
    };
  });
}

function elapsedTime(): Draft[] {
  const items: [string, number, number, number, string][] = [
    ["mde-go-kart-30", 1, 45, 30, "A go-kart ride starts at the time on the clock and lasts 30 minutes. What time does it end?"],
    ["mde-car-wash-50", 9, 20, 50, "The car wash starts at the time on the clock. It takes 50 minutes. What time is it done?"],
    ["mde-soccer-game-75", 3, 35, 75, "A soccer game starts at the time on the clock. It lasts 1 hour and 15 minutes. What time does it end?"],
    ["mde-road-trip-noon", 11, 40, 35, "The family leaves for the lake at the time on the clock. The drive takes 35 minutes. What time do they arrive?"],
    ["mde-chess-tournament", 6, 10, 160, "A chess tournament starts at the time on the clock. It lasts 2 hours and 40 minutes. What time does it end?"],
  ];
  const drafts: Draft[] = items.map(([id, h, m, add, prompt]) => {
    const end = addMinutes(h, m, add);
    const hours = Math.floor(add / 60);
    const mins = add % 60;
    const noCarry = timeLabel(addMinutes(h, 0, hours * 60).hour, (m + mins) % 60); // forgets to carry into the next hour
    const distractors = [noCarry, timeLabel(addMinutes(end.hour, end.minute, 60).hour, end.minute), timeLabel(addMinutes(end.hour, end.minute, -10).hour, addMinutes(end.hour, end.minute, -10).minute)];
    const steps: string[] = [];
    let cur = { hour: h, minute: m };
    if (hours > 0) {
      const next = addMinutes(cur.hour, cur.minute, hours * 60);
      steps.push(`${hours} hour${hours > 1 ? "s" : ""} after ${timeLabel(cur.hour, cur.minute)} is ${timeLabel(next.hour, next.minute)}.`);
      cur = next;
    }
    if (mins > 0) {
      const toHour = 60 - cur.minute;
      if (mins >= toHour) {
        const top = addMinutes(cur.hour, cur.minute, toHour);
        steps.push(`From ${timeLabel(cur.hour, cur.minute)}, ${toHour} minutes gets to ${timeLabel(top.hour, top.minute)}.`);
        if (mins > toHour) steps.push(`${mins - toHour} more minutes makes ${timeLabel(end.hour, end.minute)}.`);
      } else {
        steps.push(`${mins} more minutes makes ${timeLabel(end.hour, end.minute)}.`);
      }
    }
    return {
      id,
      skills: ["MATH-MD-TIME-ELAPSED"],
      prompt,
      visual: { kind: "clock", hour: h, minute: m },
      answer: choices(id, timeLabel(end.hour, end.minute), distractors),
      explanation: `${steps.join(" ")} It ends at ${timeLabel(end.hour, end.minute)}.`,
      band: add >= 60 ? 4 : 3,
    };
  });

  const between: [string, [number, number], [number, number], string][] = [
    ["mde-minutes-race-day", [4, 15], [5, 5], "The race starts at 4:15 and ends at 5:05. How many minutes long is the race?"],
    ["mde-minutes-swim", [9, 40], [10, 25], "Swim lessons start at 9:40 and end at 10:25. How many minutes long are they?"],
  ];
  for (const [id, [h1, m1], [h2, m2], prompt] of between) {
    const total = (h2 * 60 + m2) - (h1 * 60 + m1);
    const toHour = 60 - m1;
    drafts.push({
      id,
      skills: ["MATH-MD-TIME-ELAPSED"],
      prompt,
      answer: numeric(total, "minutes"),
      explanation: `From ${timeLabel(h1, m1)} to ${h2}:00 is ${toHour} minutes. From ${h2}:00 to ${timeLabel(h2, m2)} is ${m2} more minutes. ${toHour} + ${m2} = ${total} minutes.`,
      band: 3,
    });
  }
  return drafts;
}

function coins(): Draft[] {
  type Coin = "penny" | "nickel" | "dime" | "quarter" | "loonie" | "toonie";
  const sum = (currency: "USD" | "CAD", list: Coin[]) =>
    list.reduce((total, c) => total + (COIN_VALUES_CENTS[currency] as Record<string, number>)[c], 0);
  const valueName = (currency: "USD" | "CAD", c: Coin) => {
    const v = (COIN_VALUES_CENTS[currency] as Record<string, number>)[c];
    return v >= 100 ? `a ${c} is ${v / 100} dollar${v > 100 ? "s" : ""}` : `a ${c} is ${v} cent${v > 1 ? "s" : ""}`;
  };
  const describe = (currency: "USD" | "CAD", list: Coin[]) => {
    const kinds = [...new Set(list)];
    return `${kinds.map((k) => valueName(currency, k)).join(", ")}.`;
  };
  const countUp = (currency: "USD" | "CAD", list: Coin[]) => {
    const sorted = [...list].sort((a, b) => sum(currency, [b]) - sum(currency, [a]));
    let running = 0;
    return sorted.map((c) => dollarsOrCents((running += sum(currency, [c])))).join(", ");
  };
  const dollarsOrCents = (cents: number) => (cents >= 100 ? dollars(cents) : `${cents}`);

  const counting: [string, "USD" | "CAD", Coin[], 1 | 2 | 3 | 4][] = [
    ["mdc-us-sticker-money", "USD", ["quarter", "dime", "dime", "nickel", "penny", "penny"], 2],
    ["mdc-us-two-quarters", "USD", ["quarter", "quarter", "dime", "nickel"], 2],
    ["mdc-us-mixed-pile", "USD", ["dime", "dime", "dime", "nickel", "nickel", "penny", "penny", "penny", "penny"], 3],
    ["mdc-ca-small-change", "CAD", ["quarter", "quarter", "quarter", "dime", "dime"], 2],
    ["mdc-ca-toonie-loonie", "CAD", ["toonie", "loonie", "quarter"], 3],
    ["mdc-ca-piggy-bank", "CAD", ["loonie", "loonie", "quarter", "dime", "nickel"], 3],
  ];
  const drafts: Draft[] = counting.map(([id, currency, list, band]) => {
    const total = sum(currency, list);
    const country = currency === "USD" ? "US" : "Canadian";
    const answer: Question["answer"] =
      total < 100
        ? numeric(total, "cents")
        : choices(id, dollars(total), [dollars(total - 25), dollars(total + 100), dollars(total + 10), `${list.length} dollars`]);
    return {
      id,
      skills: ["MATH-MD-COINS"],
      prompt: `How much money are these ${country} coins worth altogether?`,
      visual: { kind: "coins", currency, coins: list },
      answer,
      explanation: `Remember: ${describe(currency, list)} Start with the biggest coins and count up: ${countUp(currency, list)}. The total is ${dollars(total)}.`,
      band,
    };
  });

  drafts.push(
    {
      id: "mdc-us-nickel-or-dime",
      skills: ["MATH-MD-COINS"],
      prompt: "The nickel is bigger than the dime. Which coin is worth more money?",
      visual: { kind: "coins", currency: "USD", coins: ["nickel", "dime"] },
      answer: choices("mdc-us-nickel-or-dime", "The dime", ["The nickel", "They are worth the same"]),
      explanation: "A dime is worth 10 cents and a nickel is worth 5 cents. The dime is smaller, but it is worth more. Size does not tell you the value of a coin.",
      band: 1,
    },
    {
      id: "mdc-ca-which-is-two-dollars",
      skills: ["MATH-MD-COINS"],
      prompt: "Which Canadian coin is worth 2 dollars?",
      visual: { kind: "coins", currency: "CAD", coins: ["loonie", "toonie", "quarter"] },
      answer: choices("mdc-ca-which-is-two-dollars", "The toonie", ["The loonie", "The quarter"]),
      explanation: "The toonie is worth 2 dollars. The loonie is worth 1 dollar, and a quarter is worth 25 cents. Toonie sounds like two!",
      band: 1,
    },
  );
  return drafts;
}

function makingChange(): Draft[] {
  return [
    {
      id: "mdm-toy-car-ten-dollars",
      skills: ["MATH-MD-MONEY"],
      prompt: "A toy car costs $6. You pay with a $10 bill. How much change do you get?",
      answer: numeric(4, "dollars"),
      explanation: "Count up from 6 to 10: 7, 8, 9, 10. That is 4 dollars of change.",
      band: 1,
    },
    {
      id: "mdm-sticker-two-quarters",
      skills: ["MATH-MD-MONEY", "MATH-MD-COINS"],
      prompt: "A racing sticker costs 35 cents. You pay with 2 quarters. How much change do you get?",
      answer: numeric(15, "cents"),
      explanation: "Two quarters are 25 + 25 = 50 cents. 50 - 35 = 15 cents of change.",
      band: 2,
    },
    {
      id: "mdm-juice-with-toonie",
      skills: ["MATH-MD-MONEY", "MATH-MD-COINS"],
      prompt: "In Canada, a juice box costs $1.50. You pay with a toonie. How much change do you get?",
      speech: "In Canada, a juice box costs one dollar and fifty cents. You pay with a toonie. How much change do you get?",
      answer: choices("mdm-juice-with-toonie", "50 cents", ["$1.50", "25 cents", "$1"]),
      explanation: "A toonie is 2 dollars. From $1.50, add 50 cents to get to $2.00. The change is 50 cents.",
      band: 3,
    },
    {
      id: "mdm-model-car-change",
      skills: ["MATH-MD-MONEY"],
      prompt: "A model car costs $7.25. You pay with a $10 bill. How much change do you get?",
      speech: "A model car costs seven dollars and twenty-five cents. You pay with a ten dollar bill. How much change do you get?",
      answer: choices("mdm-model-car-change", dollars(275), [dollars(325), dollars(225), dollars(375)]),
      explanation: "Count up from $7.25. Add 75 cents to reach $8.00. Then add $2 to reach $10.00. 75 cents and $2 make $2.75.",
      band: 4,
    },
    {
      id: "mdm-soccer-gear-left",
      skills: ["MATH-MD-MONEY", "MATH-OA-ADD-SUB"],
      prompt: "A soccer ball costs $12 and shin guards cost $9. You have $25. How much money is left after buying both?",
      answer: numeric(4, "dollars"),
      explanation: "First add the prices: 12 + 9 = 21 dollars. Then 25 - 21 = 4 dollars left.",
      band: 3,
    },
  ];
}

function rulers(): Draft[] {
  const items: [string, "in" | "cm", number, number, number, "car" | "pencil" | "crayon" | "truck" | "key" | "bus"][] = [
    ["mdl-pencil-inches", "in", 6, 0, 5, "pencil"],
    ["mdl-truck-inches-offset", "in", 8, 2, 7, "truck"],
    ["mdl-key-inches-offset", "in", 6, 3, 5, "key"],
    ["mdl-crayon-cm", "cm", 12, 0, 9, "crayon"],
    ["mdl-bus-cm-offset", "cm", 15, 4, 12, "bus"],
    ["mdl-car-cm-offset", "cm", 10, 1, 7, "car"],
  ];
  return items.map(([id, unit, length, start, end, object]) => {
    const len = end - start;
    const unitWord = unit === "in" ? (len === 1 ? "inch" : "inches") : "centimeters";
    const label = (n: number) => `${n} ${unit === "in" ? (n === 1 ? "inch" : "inches") : "centimeters"}`;
    const explanation =
      start === 0
        ? `The ${object} starts at 0 and ends at ${end}. So it is ${len} ${unitWord} long.`
        : `The ${object} starts at ${start}, not 0. Count the jumps from ${start} to ${end}: ${Array.from({ length: len }, (_, i) => start + i + 1).join(", ")}. That is ${len} jumps, so it is ${len} ${unitWord} long. The number at the end is not the length unless the ${object} starts at 0.`;
    return {
      id,
      skills: ["MATH-MD-LENGTH"],
      prompt: start === 0 ? `How long is the ${object}?` : `The ${object} does not start at 0. How long is it?`,
      visual: { kind: "ruler", unit, length, start, end, object },
      answer: choices(id, label(len), [label(end), label(len + 1), label(len - 1 || len + 2)]),
      explanation,
      band: start === 0 ? 1 : 2,
    };
  });
}

function pictureGraphs(): Draft[] {
  const goals = { kind: "pictureGraph" as const, title: "Goals scored this season", icon: "⚽", perIcon: 2, rows: [{ label: "Lions", count: 6 }, { label: "Tigers", count: 10 }, { label: "Bears", count: 4 }, { label: "Eagles", count: 8 }] };
  const cars = { kind: "pictureGraph" as const, title: "Cars in the parking lot", icon: "🚗", perIcon: 5, rows: [{ label: "Mon", count: 15 }, { label: "Tue", count: 25 }, { label: "Wed", count: 10 }, { label: "Thu", count: 20 }] };
  const chess = { kind: "pictureGraph" as const, title: "Chess pieces captured", icon: "♟️", perIcon: 1, rows: [{ label: "Pawns", count: 4 }, { label: "Knights", count: 2 }, { label: "Bishops", count: 1 }, { label: "Rooks", count: 3 }] };
  const row = (g: typeof goals, label: string) => g.rows.find((r) => r.label === label)!.count;
  const icons = (g: typeof goals, label: string) => row(g, label) / g.perIcon;
  const fewest = [...goals.rows].sort((a, b) => a.count - b.count)[0].label;
  const twenty = cars.rows.find((r) => r.count === 20)!.label;
  const chessTotal = chess.rows.reduce((t, r) => t + r.count, 0);
  const dayName: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday" };
  return [
    {
      id: "mdp-tigers-goals",
      skills: ["MATH-MD-PICTURE-GRAPH", "MATH-NBT-SKIP-COUNT"],
      prompt: "How many goals did the Tigers score?",
      visual: goals,
      answer: numeric(row(goals, "Tigers"), "goals"),
      explanation: `The key says each ball means ${goals.perIcon} goals. The Tigers have ${icons(goals, "Tigers")} balls. Count by ${goals.perIcon}s: ${Array.from({ length: icons(goals, "Tigers") }, (_, i) => (i + 1) * 2).join(", ")}. That is ${row(goals, "Tigers")} goals.`,
      band: 2,
    },
    {
      id: "mdp-eagles-more-than-bears",
      skills: ["MATH-MD-PICTURE-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more goals did the Eagles score than the Bears?",
      visual: goals,
      answer: numeric(row(goals, "Eagles") - row(goals, "Bears"), "goals"),
      explanation: `Each ball is ${goals.perIcon} goals. Eagles: ${icons(goals, "Eagles")} balls = ${row(goals, "Eagles")} goals. Bears: ${icons(goals, "Bears")} balls = ${row(goals, "Bears")} goals. ${row(goals, "Eagles")} - ${row(goals, "Bears")} = ${row(goals, "Eagles") - row(goals, "Bears")}.`,
      band: 3,
    },
    {
      id: "mdp-fewest-goals",
      skills: ["MATH-MD-PICTURE-GRAPH"],
      prompt: "Which team scored the fewest goals?",
      visual: goals,
      answer: choices("mdp-fewest-goals", fewest, goals.rows.map((r) => r.label)),
      explanation: `The row with the fewest balls shows the fewest goals. The ${fewest} have only ${icons(goals, fewest)} balls, which is ${row(goals, fewest)} goals.`,
      band: 1,
    },
    {
      id: "mdp-cars-tuesday",
      skills: ["MATH-MD-PICTURE-GRAPH", "MATH-NBT-SKIP-COUNT"],
      prompt: "How many cars were in the parking lot on Tuesday?",
      visual: cars,
      answer: numeric(row(cars, "Tue"), "cars"),
      explanation: `Each car picture means ${cars.perIcon} cars. Tuesday has ${icons(cars, "Tue")} pictures. Count by fives: ${Array.from({ length: icons(cars, "Tue") }, (_, i) => (i + 1) * 5).join(", ")}. That is ${row(cars, "Tue")} cars.`,
      band: 2,
    },
    {
      id: "mdp-cars-mon-and-wed",
      skills: ["MATH-MD-PICTURE-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many cars were there on Monday and Wednesday together?",
      visual: cars,
      answer: numeric(row(cars, "Mon") + row(cars, "Wed"), "cars"),
      explanation: `Monday: ${icons(cars, "Mon")} pictures = ${row(cars, "Mon")} cars. Wednesday: ${icons(cars, "Wed")} pictures = ${row(cars, "Wed")} cars. ${row(cars, "Mon")} + ${row(cars, "Wed")} = ${row(cars, "Mon") + row(cars, "Wed")}.`,
      band: 3,
    },
    {
      id: "mdp-which-day-twenty",
      skills: ["MATH-MD-PICTURE-GRAPH"],
      prompt: "On which day were there 20 cars?",
      visual: cars,
      answer: choices("mdp-which-day-twenty", dayName[twenty], cars.rows.map((r) => dayName[r.label])),
      explanation: `20 cars is 20 ÷ 5 = 4 pictures, because each picture means 5. The row with 4 pictures is ${dayName[twenty]}.`,
      band: 2,
    },
    {
      id: "mdp-chess-total",
      skills: ["MATH-MD-PICTURE-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many chess pieces were captured in all?",
      visual: chess,
      answer: numeric(chessTotal, "pieces"),
      explanation: `Each picture is 1 piece. Add the rows: ${chess.rows.map((r) => r.count).join(" + ")} = ${chessTotal}.`,
      band: 1,
    },
  ];
}

function barGraphs(): Draft[] {
  const colors = { kind: "barChart" as const, title: "Favorite car colors in our class", unit: "children", bars: [{ label: "Silver", value: 6 }, { label: "Red", value: 9 }, { label: "Blue", value: 4 }, { label: "Black", value: 7 }] };
  const pages = { kind: "barChart" as const, title: "Pages read this week", unit: "pages", bars: [{ label: "Mon", value: 12 }, { label: "Tue", value: 8 }, { label: "Wed", value: 14 }, { label: "Thu", value: 6 }] };
  const goals = { kind: "barChart" as const, title: "Goals in the tournament", unit: "goals", bars: [{ label: "Stars", value: 3 }, { label: "Rockets", value: 5 }, { label: "Sharks", value: 4 }, { label: "Comets", value: 2 }] };
  const v = (g: typeof colors, label: string) => g.bars.find((b) => b.label === label)!.value;
  const goalTotal = goals.bars.reduce((t, b) => t + b.value, 0);
  return [
    {
      id: "mdb-red-or-blue",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many children chose red or blue?",
      visual: colors,
      answer: numeric(v(colors, "Red") + v(colors, "Blue"), "children"),
      explanation: `The Red bar reaches ${v(colors, "Red")} and the Blue bar reaches ${v(colors, "Blue")}. ${v(colors, "Red")} + ${v(colors, "Blue")} = ${v(colors, "Red") + v(colors, "Blue")}.`,
      band: 2,
    },
    {
      id: "mdb-fewer-blue-than-black",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many fewer children chose blue than black?",
      visual: colors,
      answer: numeric(v(colors, "Black") - v(colors, "Blue"), "children"),
      explanation: `Black reaches ${v(colors, "Black")} and Blue reaches ${v(colors, "Blue")}. ${v(colors, "Black")} - ${v(colors, "Blue")} = ${v(colors, "Black") - v(colors, "Blue")} fewer.`,
      band: 3,
    },
    {
      id: "mdb-pages-wednesday",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-NBT-SKIP-COUNT"],
      prompt: "This graph counts by 2s. How many pages were read on Wednesday?",
      visual: pages,
      answer: numeric(v(pages, "Wed"), "pages"),
      explanation: `The numbers on the side go up by 2. The Wednesday bar stops at the line marked ${v(pages, "Wed")}, so ${v(pages, "Wed")} pages were read.`,
      band: 3,
    },
    {
      id: "mdb-tournament-total",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many goals did all the teams score altogether?",
      visual: goals,
      answer: numeric(goalTotal, "goals"),
      explanation: `Read each bar: ${goals.bars.map((b) => `${b.label} ${b.value}`).join(", ")}. Add them: ${goals.bars.map((b) => b.value).join(" + ")} = ${goalTotal}.`,
      band: 3,
    },
  ];
}

function calendars(): Draft[] {
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // October 2026, computed rather than typed.
  const year = 2026;
  const monthIndex = 9;
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const weekdayOf = (day: number) => WEEKDAYS[(firstWeekday + day - 1) % 7];
  const daysOn = (weekday: string) => Array.from({ length: days }, (_, i) => i + 1).filter((d) => weekdayOf(d) === weekday);
  const soccer = 17;
  const party = 23;
  const month = { kind: "calendar" as const, month: "October 2026", firstWeekday, days, marks: [{ day: soccer, emoji: "⚽" }, { day: party, emoji: "🎂" }, { day: 9, emoji: "⭐" }] };
  const saturdays = daysOn("Saturday");
  const tuesdays = daysOn("Tuesday");
  const lastFriday = daysOn("Friday").at(-1)!;
  assert(days === 31, "October has 31 days");
  return [
    {
      id: "mdcal-soccer-weekday",
      skills: ["MATH-MD-CALENDAR"],
      prompt: "The soccer game is on the day with the ball. What day of the week is it?",
      visual: month,
      answer: choices("mdcal-soccer-weekday", weekdayOf(soccer), [weekdayOf(soccer + 1), weekdayOf(soccer + 6), weekdayOf(soccer + 2)]),
      explanation: `Find the ball on the ${soccer}th. Look straight up that column to the top. It says ${weekdayOf(soccer).slice(0, 3)}, which means ${weekdayOf(soccer)}.`,
      band: 1,
    },
    {
      id: "mdcal-count-saturdays",
      skills: ["MATH-MD-CALENDAR"],
      prompt: "How many Saturdays are in October 2026?",
      visual: month,
      answer: numeric(saturdays.length, "Saturdays"),
      explanation: `Look down the Sat column: ${saturdays.join(", ")}. That is ${saturdays.length} Saturdays.`,
      band: 2,
    },
    {
      id: "mdcal-chess-club-tuesdays",
      skills: ["MATH-MD-CALENDAR"],
      prompt: "Chess club meets every Tuesday. How many times does it meet in October 2026?",
      visual: month,
      answer: numeric(tuesdays.length, "times"),
      explanation: `The Tuesdays are ${tuesdays.join(", ")}. That is ${tuesdays.length} meetings.`,
      band: 2,
    },
    {
      id: "mdcal-days-until-party",
      skills: ["MATH-MD-CALENDAR", "MATH-OA-ADD-SUB"],
      prompt: "Today is the day with the star. The birthday party is on the day with the cake. How many days until the party?",
      visual: month,
      answer: numeric(party - 9, "days"),
      explanation: `The star is on the 9th and the cake is on the ${party}rd. ${party} - 9 = ${party - 9} days. That is exactly 2 weeks, because each row is one week.`,
      band: 3,
    },
    {
      id: "mdcal-week-after-soccer",
      skills: ["MATH-MD-CALENDAR"],
      prompt: "The next soccer game is one week after the game with the ball. What date is it?",
      visual: month,
      answer: choices("mdcal-week-after-soccer", `October ${soccer + 7}`, [`October ${soccer + 1}`, `October ${soccer + 6}`, `October ${soccer + 8}`]),
      explanation: `One week is 7 days. On a calendar that is one row straight down. ${soccer} + 7 = ${soccer + 7}, so the date is October ${soccer + 7}.`,
      band: 2,
    },
    {
      id: "mdcal-last-friday",
      skills: ["MATH-MD-CALENDAR"],
      prompt: "What is the date of the last Friday in October 2026?",
      visual: month,
      answer: numeric(lastFriday),
      explanation: `Go down the Fri column to the bottom. The last number in that column is ${lastFriday}.`,
      band: 2,
    },
  ];
}

export const measurementQuestions = (): Question[] =>
  [...clockBasics(), ...timeToFiveMinutes(), ...elapsedTime(), ...coins(), ...makingChange(), ...rulers(), ...pictureGraphs(), ...barGraphs(), ...calendars()].map((d) =>
    question(FILE, d),
  );

