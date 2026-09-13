"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/content/schema";
import { localDateOf } from "@/lib/engine/dates";
import { isCorrect, type Response } from "@/lib/engine/grade";
import { enqueue, pendingCount, startBackgroundSync } from "@/lib/outbox";
import { questionSpeech, speakable } from "@/lib/speech";
import { useSpeech } from "@/lib/use-speech";
import { Scratchpad } from "./Scratchpad";
import { Visual } from "./visuals/Visual";

type Confidence = "LOW" | "MEDIUM" | "HIGH";
type Phase = "ready" | "answering" | "feedback" | "done";

// Sessions end quietly after this long, even mid-list. Nothing on screen counts down.
const SESSION_LIMIT_MS = 12 * 60 * 1000;

// Timing is only read inside tap handlers, never while rendering.
const clock = () => performance.now();

const FACES: { value: Confidence; face: string; label: string }[] = [
  { value: "LOW", face: "😟", label: "Not sure" },
  { value: "MEDIUM", face: "🙂", label: "Kind of sure" },
  { value: "HIGH", face: "😄", label: "Very sure" },
];

type Props = {
  student: { id: string; name: string; avatar: string };
  questions: Question[];
  /** Why each question was chosen, keyed by question id. Saved with the answer for the grown-ups page. */
  reasons?: Record<string, string>;
  /** When false (dev preview) nothing is saved. */
  save?: boolean;
};

export function Player({ student, questions, reasons = {}, save = true }: Props) {
  const { speak, stop, supported: canSpeak } = useSpeech();
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<{ correct: boolean; confidence: Confidence } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pending, setPending] = useState(0);
  // How the child is working this question out. Reset for every question.
  const [scratch, setScratch] = useState({ open: false, strokes: 0, paper: false });

  // endItemId stays the same for the whole session, so each new end marker replaces the last one in the upload queue.
  const session = useRef({ id: "", endItemId: "", startedAt: "", startedMs: 0, active: false });
  const timing = useRef({ shownAt: 0, firstActionMs: null as number | null, listens: 0 });

  const question = questions[index];

  const markSessionEnd = () => {
    if (!save || !session.current.active) return;
    void enqueue({
      kind: "sessionEnd",
      id: session.current.endItemId,
      studentId: student.id,
      sessionId: session.current.id,
      sessionStartedAt: session.current.startedAt,
      endedAt: new Date().toISOString(),
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
    const stopSync = startBackgroundSync();
    const timer = window.setInterval(() => pendingCount().then(setPending).catch(() => {}), 3000);
    return () => {
      stopSync();
      window.clearInterval(timer);
    };
  }, [save]);

  const showQuestion = (i: number) => {
    setIndex(i);
    setChoice(null);
    setDigits("");
    setResult(null);
    setShowExplanation(false);
    setScratch({ open: false, strokes: 0, paper: false });
    setPhase("answering");
    timing.current = { shownAt: clock(), firstActionMs: null, listens: 0 };
    speak(questionSpeech(questions[i]));
  };

  const start = () => {
    session.current = { id: crypto.randomUUID(), endItemId: crypto.randomUUID(), startedAt: new Date().toISOString(), startedMs: clock(), active: true };
    showQuestion(0);
  };

  const markAction = () => {
    timing.current.firstActionMs ??= Math.round(clock() - timing.current.shownAt);
  };

  const listen = () => {
    timing.current.listens += 1;
    speak(questionSpeech(question));
  };

  const response: Response | null = !question
    ? null
    : question.answer.type === "numeric"
      ? digits === ""
        ? null
        : { type: "numeric", value: Number(digits) }
      : choice === null
        ? null
        : { type: question.answer.type === "choice" ? "choice" : "step", index: choice };

  const submit = (confidence: Confidence) => {
    if (!response) return;
    stop();
    const correct = isCorrect(question, response);
    setResult({ correct, confidence });
    setPhase("feedback");

    if (save) {
      void enqueue({
        kind: "attempt",
        id: crypto.randomUUID(),
        studentId: student.id,
        sessionId: session.current.id,
        sessionStartedAt: session.current.startedAt,
        questionId: question.id,
        response,
        confidence,
        firstActionMs: timing.current.firstActionMs,
        totalMs: Math.round(clock() - timing.current.shownAt),
        listenCount: timing.current.listens,
        answeredAt: new Date().toISOString(),
        localDate: localDateOf(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
        selectionReason: reasons[question.id]?.slice(0, 200),
        scratchpad: scratch.strokes > 0 ? "DIGITAL" : scratch.paper ? "PAPER" : "NONE",
        scratchpadStrokes: scratch.strokes,
      });
    }

    if (correct) {
      speak("You got it! Nice careful thinking.");
    } else {
      setShowExplanation(true);
      const opener = confidence === "HIGH" ? "You felt really sure. Let's look at it together." : "Let's check it together.";
      speak(`${opener} ${speakable(question.explanation)}`);
    }
  };

  const next = () => {
    const outOfTime = clock() - session.current.startedMs > SESSION_LIMIT_MS;
    if (index + 1 >= questions.length || outOfTime) {
      finish();
    } else {
      showQuestion(index + 1);
    }
  };

  const finish = () => {
    stop();
    setPhase("done");
    speak(`Great work, ${student.name}! You tried ${index + 1} puzzles. Time for a break.`);
    markSessionEnd();
    session.current.active = false;
  };

  if (questions.length === 0) {
    return <Shell onLeave={markSessionEnd} pending={pending}><p className="text-center text-2xl">No puzzles available yet.</p></Shell>;
  }

  if (phase === "ready") {
    return (
      <Shell onLeave={markSessionEnd} pending={pending}>
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

  if (phase === "done") {
    const tried = index + 1;
    return (
      <Shell onLeave={markSessionEnd} pending={pending}>
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
  const correctLabel =
    answer.type === "choice"
      ? answer.choices[answer.correctIndex]
      : answer.type === "findTheBug"
        ? `Step ${answer.bugIndex + 1}`
        : `${answer.value}${answer.unit ? ` ${answer.unit}` : ""}`;

  return (
    <Shell onLeave={markSessionEnd} pending={pending} progress={{ current: index + 1, total: questions.length }}>
      <article className="rounded-3xl bg-cream p-4 text-ink shadow-xl sm:p-6">
        <div className="flex items-start gap-3">
          {canSpeak && (
            <button onClick={listen} aria-label="Read the question out loud" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-3xl text-cream active:translate-y-0.5">
              🔊
            </button>
          )}
          <h1 className="text-2xl leading-snug font-extrabold sm:text-3xl">{question.prompt}</h1>
        </div>
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
      </div>
      {/* Kept mounted while hidden so drawings survive closing and reopening; a new key clears it per question. */}
      <div hidden={!scratch.open}>
        <Scratchpad key={question.id} onStrokesChange={(strokes) => setScratch((sc) => ({ ...sc, strokes }))} />
      </div>

      {answer.type === "findTheBug" ? (
        <ol className="mt-4 grid gap-3" aria-label={`${answer.solver}'s steps`}>
          {answer.steps.map((step, i) => {
            const picked = choice === i;
            const reveal = phase === "feedback";
            const tone = reveal
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
                  disabled={reveal}
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
                <span>{label}</span>
              </button>
            );
          })}
        </div>
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
        <section className="mt-5 rounded-3xl bg-bg-mid p-4 text-center">
          <p className="mb-3 text-xl font-extrabold">How sure are you?</p>
          <div className="grid grid-cols-3 gap-3">
            {FACES.map((f) => (
              <button key={f.value} onClick={() => submit(f.value)} className="flex flex-col items-center gap-1 rounded-2xl bg-cream py-3 text-ink active:translate-y-0.5">
                <span className="text-5xl">{f.face}</span>
                <span className="text-base font-bold">{f.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {phase === "feedback" && result && (
        <section className="mt-5 rounded-3xl bg-bg-mid p-5">
          {result.correct ? (
            <p className="font-display text-3xl font-extrabold text-moss-light">You got it! Nice careful thinking. 🎉</p>
          ) : (
            <>
              <p className="font-display text-3xl font-extrabold text-gold">
                {result.confidence === "HIGH" ? "You felt really sure. Let's look at it together. 🔍" : "Let's check it together. 🔍"}
              </p>
              <p className="mt-2 text-xl">
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
                speak(speakable(question.explanation));
              }}
              className="mt-3 text-xl font-bold text-gold underline underline-offset-4"
            >
              How do we know?
            </button>
          )}
          <button onClick={next} className="big-button mt-5 w-full bg-gold text-ink">
            {index + 1 >= questions.length ? "Finish ⭐" : "Next puzzle ➜"}
          </button>
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
}: {
  children: React.ReactNode;
  onLeave: () => void;
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
        <span className="min-w-12 text-right text-sm text-cream-dim" title="Answers waiting to upload">
          {pending > 0 ? `☁️ ${pending}` : ""}
        </span>
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
