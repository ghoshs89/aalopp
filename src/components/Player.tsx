"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@/content/schema";
import { shouldSuggestBreak } from "@/lib/engine/breaks";
import { localDateOf } from "@/lib/engine/dates";
import { isCorrect, type Response } from "@/lib/engine/grade";
import { enqueue, pendingCount } from "@/lib/outbox";
import { questionSpeechParts, speakable, teachSpeechParts } from "@/lib/speech";
import { useSpeech } from "@/lib/use-speech";
import { useSpeechInput } from "@/lib/use-speech-input";
import { useVoicePreference } from "@/lib/voice-preference";
import { matchSpokenChoice } from "@/lib/voices";
import { Scratchpad } from "./Scratchpad";
import { Visual } from "./visuals/Visual";

type Phase = "ready" | "learning" | "answering" | "feedback" | "done";

// Sessions end quietly after this long, even mid-list. Nothing on screen counts down.
const SESSION_LIMIT_MS = 12 * 60 * 1000;

// Find the Bug, when he taps a step that comes after the first mistake. Never claim that step itself is false,
// because an independent true premise can appear after an earlier wrong step.
const NUDGE = "Not quite. The first mistake happened earlier. Look above that step.";
const FOUND_WITH_NUDGE = "You found it! Next time, start checking from the top.";

// Timing is only read inside tap handlers, never while rendering.
const clock = () => performance.now();

type Props = {
  student: { id: string; name: string; avatar: string };
  questions: Question[];
  /** Why each question was chosen, keyed by question id. Saved with the answer for the grown-ups page. */
  reasons?: Record<string, string>;
  /** Question ids he has answered before. A teach card is only shown the first time he meets a question. */
  seen?: string[];
  /** When false (dev preview) nothing is saved. */
  save?: boolean;
};

export function Player({ student, questions, reasons = {}, seen = [], save = true }: Props) {
  const seenIds = useMemo(() => new Set(seen), [seen]);
  const { speak, stop, supported: canSpeak } = useSpeech();
  const [voiceOn, setVoiceOn] = useVoicePreference();
  // Automatic reading follows the on/off switch. Buttons the child taps on purpose (🔊, Hear it) always speak.
  const autoSpeak: typeof speak = (input) => {
    if (voiceOn) speak(input);
  };
  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) stop();
    else if (phase === "learning" && question?.teach) speak(teachSpeechParts(question));
    else if (phase === "answering" && question) speak(questionSpeechParts(question));
  };
  const speechInput = useSpeechInput();
  const [heard, setHeard] = useState<{ text: string; matched: boolean } | null>(null);
  // Answers so far this session (true = right), for the break suggestion.
  const results = useRef<boolean[]>([]);
  const breakSuggested = useRef(false);
  const [offerBreak, setOfferBreak] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  // Find the Bug: the step he tapped first, when it came after the real bug and he was nudged to look earlier.
  const [firstTap, setFirstTap] = useState<number | null>(null);
  const [digits, setDigits] = useState("");
  const [placedOrder, setPlacedOrder] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [saveWarning, setSaveWarning] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; foundWithNudge: boolean } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pending, setPending] = useState(0);
  // How the child is working this question out. Reset for every question.
  const [scratch, setScratch] = useState({ open: false, strokes: 0, paper: false });

  // Every sessionEnd gets its own UUID so the outbox stays append-only (avoids an in-flight upload deleting a newer end).
  const session = useRef({ id: "", startedAt: "", startedMs: 0, active: false });
  const timing = useRef({ shownAt: 0, firstActionMs: null as number | null, listens: 0 });
  const lastSave = useRef<Promise<void>>(Promise.resolve());

  const question = questions[index];

  const markSessionEnd = () => {
    if (!save || !session.current.active) return;
    lastSave.current = enqueue({
      kind: "sessionEnd",
      id: crypto.randomUUID(),
      studentId: student.id,
      sessionId: session.current.id,
      sessionStartedAt: session.current.startedAt,
      endedAt: new Date().toISOString(),
    }).catch(() => {
      setSaveWarning(true);
    });
  };
  const markSessionEndRef = useRef(markSessionEnd);
  useEffect(() => {
    markSessionEndRef.current = markSessionEnd;
  });

  // Leaving partway (switching apps, locking the tablet) still records when the session stopped.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && markSessionEndRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useEffect(() => {
    if (!save) return;
    const timer = window.setInterval(() => pendingCount().then(setPending).catch(() => {}), 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [save]);

  const showQuestion = (i: number) => {
    setIndex(i);
    setChoice(null);
    setFirstTap(null);
    setDigits("");
    setPlacedOrder([]);
    setShowHint(false);
    setSaveWarning(false);
    setResult(null);
    setShowExplanation(false);
    setScratch({ open: false, strokes: 0, paper: false });
    setHeard(null);
    setOfferBreak(false);
    speechInput.cancel();
    const next = questions[i];
    const teaching = next.teach !== undefined && !seenIds.has(next.id);
    setPhase(teaching ? "learning" : "answering");
    // The clock starts when the question appears, never when the card does, or a taught question would look like it
    // took him a minute to think about. `beginQuestion` restarts it when he taps "Got it".
    timing.current = { shownAt: clock(), firstActionMs: null, listens: 0 };
    if (teaching) autoSpeak(teachSpeechParts(next));
    else autoSpeak(questionSpeechParts(next));
  };

  /** Leaving the teach card: the question is now on screen, so the timer starts here. */
  const beginQuestion = () => {
    stop();
    setPhase("answering");
    timing.current = { shownAt: clock(), firstActionMs: null, listens: 0 };
    autoSpeak(questionSpeechParts(questions[index]));
  };

  const start = () => {
    session.current = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), startedMs: clock(), active: true };
    results.current = [];
    breakSuggested.current = false;
    showQuestion(0);
  };

  const markAction = () => {
    timing.current.firstActionMs ??= Math.round(clock() - timing.current.shownAt);
  };

  const listen = () => {
    timing.current.listens += 1;
    speak(questionSpeechParts(question));
  };

  const response: Response | null = !question
    ? null
    : question.answer.type === "numeric"
      ? digits === ""
        ? null
        : { type: "numeric", value: Number(digits) }
      : question.answer.type === "order"
        ? placedOrder.length === question.answer.items.length
          ? { type: "order", order: placedOrder }
          : null
        : choice === null
          ? null
          : question.answer.type === "choice"
            ? { type: "choice", index: choice, value: question.answer.choices[choice] }
            : firstTap === null
              ? { type: "step", index: choice }
              : { type: "step", index: firstTap, secondIndex: choice };

  const submit = () => {
    if (!response) return;
    stop();
    const { answer } = question;
    // Tapping a step after the bug means he looked past where it started. Point him earlier once, and
    // keep the first tap: that is what gets graded, so finding it with help never counts toward mastery.
    if (answer.type === "findTheBug" && response.type === "step" && firstTap === null && response.index > answer.bugIndex) {
      setFirstTap(response.index);
      setChoice(null);
      autoSpeak(NUDGE);
      return;
    }
    const correct = isCorrect(question, response);
    const foundWithNudge = answer.type === "findTheBug" && response.type === "step" && response.secondIndex === answer.bugIndex;
    setResult({ correct, foundWithNudge });
    setPhase("feedback");
    speechInput.cancel();
    // Finding it after a nudge is not the kind of run a break is for.
    results.current.push(correct || foundWithNudge);
    if (index + 1 < questions.length && shouldSuggestBreak(results.current, breakSuggested.current)) {
      breakSuggested.current = true;
      setOfferBreak(true);
    }

    if (save) {
      lastSave.current = enqueue({
        kind: "attempt",
        id: crypto.randomUUID(),
        studentId: student.id,
        sessionId: session.current.id,
        sessionStartedAt: session.current.startedAt,
        questionId: question.id,
        response,
        confidence: null,
        firstActionMs: timing.current.firstActionMs,
        totalMs: Math.round(clock() - timing.current.shownAt),
        listenCount: timing.current.listens,
        answeredAt: new Date().toISOString(),
        localDate: localDateOf(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
        selectionReason: reasons[question.id]?.slice(0, 200),
        scratchpad: scratch.strokes > 0 ? "DIGITAL" : scratch.paper ? "PAPER" : "NONE",
        scratchpadStrokes: scratch.strokes,
      }).catch(() => {
        setSaveWarning(true);
      });
    }

    const didYouKnow = question.didYouKnow ? ` Did you know? ${speakable(question.didYouKnow)}` : "";
    if (correct) {
      autoSpeak(`You got it! Nice careful thinking.${didYouKnow}`);
    } else if (foundWithNudge) {
      autoSpeak(`${FOUND_WITH_NUDGE}${didYouKnow}`);
    } else {
      setShowExplanation(true);
      autoSpeak(`Let's check it together. ${speakable(question.explanation)}${didYouKnow}`);
    }
  };

  const next = async () => {
    await lastSave.current;
    const outOfTime = clock() - session.current.startedMs > SESSION_LIMIT_MS;
    if (index + 1 >= questions.length || outOfTime) {
      await finish();
    } else {
      showQuestion(index + 1);
    }
  };

  const finish = async () => {
    stop();
    await lastSave.current;
    setPhase("done");
    autoSpeak(`Great work, ${student.name}! You tried ${index + 1} puzzles. Time for a break.`);
    markSessionEnd();
    await lastSave.current;
    session.current.active = false;
  };

  if (questions.length === 0) {
    return <Shell onLeave={markSessionEnd} voice={canSpeak ? { on: voiceOn, toggle: toggleVoice } : undefined} pending={pending}><p className="text-center text-2xl">No puzzles available yet.</p></Shell>;
  }

  if (phase === "ready") {
    return (
      <Shell onLeave={markSessionEnd} voice={canSpeak ? { on: voiceOn, toggle: toggleVoice } : undefined} pending={pending}>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="text-8xl">{student.avatar}</div>
          <h1 className="font-display text-4xl font-extrabold">Ready, {student.name}?</h1>
          <p className="text-xl text-cream-dim">{questions.length} puzzles are waiting for you.</p>
          <button onClick={start} className="big-button bg-gold text-ink">
            Let&apos;s go! 🚀
          </button>
        </div>
      </Shell>
    );
  }

  // A fact he has not met yet is shown before he is asked about it. Knowledge questions cannot be reasoned out, so
  // being asked first would just be a guess. Once he has answered the question once, this is skipped for good.
  if (phase === "learning" && questions[index]?.teach) {
    const teach = questions[index].teach;
    return (
      <Shell
        onLeave={markSessionEnd}
        voice={canSpeak ? { on: voiceOn, toggle: toggleVoice } : undefined}
        pending={pending}
        progress={{ current: index + 1, total: questions.length }}
      >
        <article className="rounded-3xl bg-cream p-5 text-ink shadow-xl sm:p-7">
          <p className="font-display text-sm font-extrabold tracking-widest text-ink/50 uppercase">Something new</p>
          <h1 className="font-display mt-1 text-4xl font-extrabold">{teach.title}</h1>
          {teach.visual && (
            <div className="mt-4">
              <Visual visual={teach.visual} />
            </div>
          )}
          <ul className="mt-4 grid gap-3">
            {teach.lines.map((line, i) => (
              <li key={i} className="flex gap-3 text-xl leading-relaxed">
                <span aria-hidden className="text-moss">
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </article>
        <button onClick={beginQuestion} className="big-button mt-5 w-full bg-gold text-ink">
          Got it 👍
        </button>
      </Shell>
    );
  }

  if (phase === "done") {
    const tried = index + 1;
    return (
      <Shell onLeave={markSessionEnd} voice={canSpeak ? { on: voiceOn, toggle: toggleVoice } : undefined} pending={pending}>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="text-6xl leading-tight">{"⭐".repeat(Math.min(tried, 10))}</div>
          <h1 className="font-display text-4xl font-extrabold">Great work, {student.name}!</h1>
          <p className="text-xl text-cream-dim">You tried {tried} puzzles. Every try makes your brain stronger.</p>
          <p className="text-xl">Time for a break. Go stretch like a kangaroo! 🦘</p>
          <Link href="/" className="big-button bg-cream text-ink">
            All done
          </Link>
        </div>
      </Shell>
    );
  }

  const answer = question.answer;
  // Tapping a step after the bug means he spotted a wrong step, just not the first one. That is a different mistake
  // from picking a step that was true, and saying so is what the question is actually teaching.
  const tappedLaterStep = answer.type === "findTheBug" && choice !== null && choice > answer.bugIndex;
  const correctLabel =
    answer.type === "choice"
      ? answer.choices[answer.correctIndex]
      : answer.type === "findTheBug"
        ? `Step ${answer.bugIndex + 1}`
        : answer.type === "order"
          ? answer.correctOrder.join(" -> ")
          : `${answer.value}${answer.unit ? ` ${answer.unit}` : ""}`;

  return (
    <Shell onLeave={markSessionEnd} voice={canSpeak ? { on: voiceOn, toggle: toggleVoice } : undefined} pending={pending} progress={{ current: index + 1, total: questions.length }}>
      <article className="rounded-3xl bg-cream p-4 text-ink shadow-xl sm:p-6">
        {question.passage && (
          <div className="mb-4 rounded-2xl border-2 border-ink/10 bg-white p-4">
            <p className="mb-1 text-sm font-extrabold tracking-wide text-ink/60 uppercase">Read this</p>
            <p className="text-xl leading-relaxed font-semibold sm:text-2xl">{question.passage}</p>
          </div>
        )}
        <div className="flex items-start gap-3">
          {canSpeak && (
            <button onClick={listen} aria-label="Read the question out loud" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-3xl text-cream active:translate-y-0.5">
              🔊
            </button>
          )}
          <h1 className="text-2xl leading-snug font-extrabold sm:text-3xl">{question.prompt}</h1>
        </div>
        {question.listen &&
          (canSpeak ? (
            <button
              onClick={() => {
                timing.current.listens += 1;
                speak([{ text: question.listen!.text, lang: question.listen!.lang }]);
              }}
              className="mt-3 rounded-2xl bg-ink px-4 py-2 text-lg font-bold text-cream active:translate-y-0.5"
            >
              🔊 Hear it
            </button>
          ) : (
            <p className="mt-3 inline-block rounded-2xl border-2 border-ink/15 bg-white px-4 py-2 text-lg font-bold text-ink">
              Word to read: &quot;{question.listen.text}&quot;
            </p>
          ))}
        {question.visual && (
          <div className="mt-4">
            <Visual visual={question.visual} />
          </div>
        )}
      </article>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setScratch((sc) => ({ ...sc, open: !sc.open }))}
          aria-pressed={scratch.open}
          className={`rounded-2xl border-2 px-4 py-2 text-lg font-bold ${scratch.open ? "border-gold bg-gold text-ink" : "border-white/15 bg-bg-hill"}`}
        >
          ✏️ {scratch.open ? "Hide scratchpad" : "Scratchpad"}
        </button>
        <button
          onClick={() => setScratch((sc) => ({ ...sc, paper: !sc.paper }))}
          aria-pressed={scratch.paper}
          className={`rounded-2xl border-2 px-4 py-2 text-lg font-bold ${scratch.paper ? "border-gold bg-gold text-ink" : "border-white/15 bg-bg-hill"}`}
        >
          📝 {scratch.paper ? "Using paper" : "I'm using paper"}
        </button>
        {question.hint && phase === "answering" && (
          <button
            onClick={() => {
              setShowHint((h) => {
                if (!h) autoSpeak(`Hint: ${speakable(question.hint!)}`);
                return true;
              });
            }}
            aria-expanded={showHint}
            className={`rounded-2xl border-2 px-4 py-2 text-lg font-bold ${showHint ? "border-gold bg-gold text-ink" : "border-white/15 bg-bg-hill"}`}
          >
            💡 {showHint ? "Hint shown" : "Need a hint?"}
          </button>
        )}
        {question.voiceAnswer && answer.type === "choice" && speechInput.supported && phase === "answering" && (
          <button
            onClick={() => {
              const lang = { en: "en-US", es: "es-ES", fr: "fr-FR" }[question.language];
              setHeard(null);
              speechInput.listen(lang, (alternatives) => {
                const match = matchSpokenChoice(alternatives, answer.choices);
                if (match !== null) {
                  markAction();
                  setChoice(match);
                }
                setHeard({ text: alternatives[0] ?? "", matched: match !== null });
              });
            }}
            aria-pressed={speechInput.listening}
            className={`rounded-2xl border-2 px-4 py-2 text-lg font-bold ${speechInput.listening ? "border-gold bg-gold text-ink" : "border-white/15 bg-bg-hill"}`}
          >
            🎤 {speechInput.listening ? "Listening..." : "Say it"}
          </button>
        )}
      </div>
      {showHint && question.hint && phase === "answering" && (
        <p className="mt-3 rounded-2xl border-2 border-gold/40 bg-bg-mid p-4 text-lg leading-relaxed" role="status">
          <span className="font-extrabold text-gold">Hint: </span>
          {question.hint}
        </p>
      )}
      {saveWarning && (
        <p className="mt-2 text-base text-gold" role="status">
          Could not save on this device right now. Your answer was checked, and we will keep trying.
        </p>
      )}
      {heard && (
        <p className="mt-2 text-lg text-cream-dim" role="status">
          {heard.matched ? `I heard "${heard.text}". Is that your answer?` : heard.text ? `I heard "${heard.text}". Tap your answer, or try again.` : "I did not catch that. Tap your answer, or try again."}
        </p>
      )}
      {/* Kept mounted while hidden so drawings survive closing and reopening; a new key clears it per question. */}
      <div hidden={!scratch.open}>
        <Scratchpad key={question.id} onStrokesChange={(strokes) => setScratch((sc) => ({ ...sc, strokes }))} />
      </div>

      {answer.type === "findTheBug" && firstTap !== null && phase === "answering" && (
        <p className="mt-4 rounded-2xl bg-bg-mid p-4 text-xl font-bold" role="status">
          {NUDGE} 👆
        </p>
      )}
      {answer.type === "findTheBug" ? (
        <ol className="mt-4 grid gap-3" aria-label={`${answer.solver}'s steps`}>
          {answer.steps.map((step, i) => {
            const picked = choice === i;
            const reveal = phase === "feedback";
            const ruledOut = !reveal && firstTap !== null && i >= firstTap;
            const tone = ruledOut
              ? "border-white/10 bg-bg-hill opacity-50"
              : reveal
              ? i === answer.bugIndex
                ? "border-danger bg-danger/20"
                : picked
                  ? "border-gold/60 bg-bg-hill"
                  : "border-white/10 bg-bg-hill opacity-70"
              : picked
                ? "border-gold bg-gold/20"
                : "border-white/15 bg-bg-hill";
            return (
              <li key={i}>
                <button
                  disabled={reveal || ruledOut}
                  onClick={() => {
                    markAction();
                    setChoice(i);
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border-4 px-4 py-3 text-left text-xl font-bold active:translate-y-0.5 ${tone}`}
                >
                  <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-base font-extrabold text-ink">Step {i + 1}</span>
                  <span>
                    {step}
                    {reveal && i === answer.bugIndex && <span className="mt-2 block text-lg font-semibold text-moss-light">Should be: {answer.fix}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : answer.type === "choice" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {answer.choices.map((label, i) => {
            const picked = choice === i;
            const reveal = phase === "feedback";
            const tone = reveal
              ? i === answer.correctIndex
                ? "border-moss bg-moss/25"
                : picked
                  ? "border-danger/70 bg-danger/15"
                  : "border-white/10 bg-bg-hill opacity-60"
              : picked
                ? "border-gold bg-gold/20"
                : "border-white/15 bg-bg-hill";
            return (
              <button
                key={i}
                disabled={reveal}
                onClick={() => {
                  markAction();
                  setChoice(i);
                }}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-4 px-4 py-3 text-left text-xl font-bold active:translate-y-0.5 ${tone}`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-lg font-extrabold text-ink">{"ABCDE"[i]}</span>
                {answer.choiceVisuals ? (
                  <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <Visual visual={answer.choiceVisuals[i]} />
                    {/* The name only appears once the answer is checked, or the picture would not be a question. */}
                    {reveal && <span className="truncate text-base">{label}</span>}
                  </span>
                ) : (
                  <span>{label}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : answer.type === "order" ? (
        <OrderBoard
          items={answer.items}
          slots={answer.slots}
          placed={placedOrder}
          correctOrder={answer.correctOrder}
          reveal={phase === "feedback"}
          onChange={(nextOrder) => {
            markAction();
            setPlacedOrder(nextOrder);
          }}
        />
      ) : (
        <NumberPad
          value={digits}
          unit={answer.type === "numeric" ? answer.unit : undefined}
          disabled={phase === "feedback"}
          onChange={(v) => {
            markAction();
            setDigits(v);
          }}
        />
      )}

      {phase === "answering" && response && (
        <button onClick={submit} className="big-button mt-5 w-full bg-gold text-ink">
          Check answer ✓
        </button>
      )}

      {phase === "feedback" && result && (
        <section className="mt-5 rounded-3xl bg-bg-mid p-5">
          {result.correct ? (
            <p className="font-display text-3xl font-extrabold text-moss-light">You got it! Nice careful thinking. 🎉</p>
          ) : result.foundWithNudge ? (
            <p className="font-display text-3xl font-extrabold text-moss-light">{FOUND_WITH_NUDGE} 🔍</p>
          ) : (
            <>
              <p className="font-display text-3xl font-extrabold text-gold">Let&apos;s check it together. 🔍</p>
              <p className="mt-2 text-xl">
                {tappedLaterStep && "So close. Something went wrong before that step. "}
                {answer.type === "findTheBug" ? "The first mistake is in " : "The answer is "}
                <strong className="text-moss-light">{correctLabel}</strong>.
              </p>
            </>
          )}
          {showExplanation ? (
            <p className="mt-3 text-xl leading-relaxed">{question.explanation}</p>
          ) : (
            <button
              onClick={() => {
                setShowExplanation(true);
                autoSpeak(speakable(question.explanation));
              }}
              className="mt-3 text-xl font-bold text-gold underline underline-offset-4"
            >
              How do we know?
            </button>
          )}
          {question.didYouKnow && (
            <p className="mt-3 rounded-2xl bg-bg-hill p-3 text-lg leading-relaxed">
              <span className="font-extrabold text-gold">Did you know? </span>
              {question.didYouKnow}
            </p>
          )}
          {offerBreak ? (
            <div className="mt-5 rounded-2xl bg-bg-hill p-4">
              <p className="text-xl font-bold">That was a tricky run. Tricky puzzles grow your brain. Want a short break?</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button onClick={finish} className="big-button bg-cream text-ink">
                  Take a break 🦘
                </button>
                <button onClick={next} className="big-button bg-gold text-ink">
                  Keep going ➜
                </button>
              </div>
            </div>
          ) : (
            <button onClick={next} className="big-button mt-5 w-full bg-gold text-ink">
              {index + 1 >= questions.length ? "Finish ⭐" : "Next puzzle ➜"}
            </button>
          )}
        </section>
      )}
    </Shell>
  );
}

function Shell({
  children,
  pending,
  progress,
  onLeave,
  voice,
}: {
  children: React.ReactNode;
  onLeave: () => void;
  voice?: { on: boolean; toggle: () => void };
  pending: number;
  progress?: { current: number; total: number };
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" onClick={onLeave} className="rounded-xl bg-bg-mid px-3 py-2 text-lg font-bold" aria-label="Back to players">
          🏠
        </Link>
        {progress && (
          <div className="flex flex-1 justify-center gap-1.5" aria-label={`Puzzle ${progress.current} of ${progress.total}`}>
            {Array.from({ length: progress.total }, (_, i) => (
              <span key={i} className={`h-3 flex-1 max-w-10 rounded-full ${i < progress.current ? "bg-gold" : "bg-bg-mid"}`} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="min-w-8 text-right text-sm text-cream-dim" title="Answers waiting to upload">
            {pending > 0 ? `☁️ ${pending}` : ""}
          </span>
          {voice && (
            <button
              onClick={voice.toggle}
              aria-pressed={voice.on}
              aria-label={voice.on ? "Voice is on. Tap to turn it off." : "Voice is off. Tap to turn it on."}
              className={`rounded-xl px-3 py-2 text-base font-bold whitespace-nowrap ${voice.on ? "bg-gold text-ink" : "bg-bg-mid text-cream"}`}
            >
              {voice.on ? "🔊 Voice on" : "🔇 Voice off"}
            </button>
          )}
        </div>
      </div>
      {children}
    </main>
  );
}

function NumberPad({
  value,
  unit,
  disabled,
  onChange,
}: {
  value: string;
  unit?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === "⌫") onChange(value.slice(0, -1));
    else if (value.length < 4) onChange(value === "0" ? key : value + key);
  };
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex min-h-16 min-w-48 items-center justify-center gap-2 rounded-2xl border-4 border-gold bg-cream px-6 text-4xl font-extrabold text-ink">
        <span>{value || "?"}</span>
        {unit && <span className="text-2xl text-ink/70">{unit}</span>}
      </div>
      <div className="grid w-full max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
              <button
                key={i}
                disabled={disabled}
                onClick={() => press(key)}
                aria-label={key === "⌫" ? "Delete" : key}
                className="h-16 rounded-2xl border-2 border-white/15 bg-bg-hill text-3xl font-extrabold active:translate-y-0.5 disabled:opacity-50"
              >
                {key}
              </button>
            ),
          )}
      </div>
    </div>
  );
}

function OrderBoard({
  items,
  slots,
  placed,
  correctOrder,
  reveal,
  onChange,
}: {
  items: string[];
  slots?: string[];
  placed: string[];
  correctOrder: string[];
  reveal: boolean;
  onChange: (order: string[]) => void;
}) {
  const remaining = items.filter((item) => !placed.includes(item));
  const labels = slots ?? items.map((_, i) => `${i + 1}`);
  const removeAt = (slotIdx: number) => {
    if (reveal || slotIdx >= placed.length) return;
    onChange(placed.filter((_, i) => i !== slotIdx));
  };
  const place = (item: string) => {
    if (reveal || placed.includes(item) || placed.length >= items.length) return;
    onChange([...placed, item]);
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {labels.map((slotLabel, i) => {
          const item = placed[i];
          const tone = reveal
            ? item === correctOrder[i]
              ? "border-moss bg-moss/25"
              : "border-danger/70 bg-danger/15"
            : item
              ? "border-gold bg-gold/20"
              : "border-dashed border-white/25 bg-bg-mid/60";
          return (
            <button
              key={slotLabel}
              disabled={reveal || !item}
              onClick={() => removeAt(i)}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border-4 px-4 py-3 text-left text-xl font-bold active:translate-y-0.5 ${tone}`}
            >
              <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-base font-extrabold text-ink">{slotLabel}</span>
              <span className={item ? "" : "text-cream-dim"}>{item ?? "Tap below"}</span>
            </button>
          );
        })}
      </div>
      {!reveal && (
        <div className="rounded-3xl bg-bg-mid p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-base font-bold text-cream-dim">Tap in order (tap a placed slot to take it back):</p>
            {placed.length > 0 && (
              <button onClick={() => onChange([])} className="rounded-xl bg-bg-hill px-3 py-1 text-sm font-bold">
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {remaining.map((item) => (
              <button
                key={item}
                onClick={() => place(item)}
                className="rounded-2xl border-2 border-white/20 bg-cream px-4 py-3 text-xl font-extrabold text-ink shadow active:translate-y-0.5"
              >
                {item}
              </button>
            ))}
            {remaining.length === 0 && <p className="text-base text-moss-light">All slots filled. Tap Check answer below!</p>}
          </div>
        </div>
      )}
    </div>
  );
}
