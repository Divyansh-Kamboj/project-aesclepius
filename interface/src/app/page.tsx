"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRIEF_TEXT =
  "The year is 2026. The system has reached its breaking point. You have been appointed Director of the Regional Safety Net. Your budget is $100 Million. Every dollar you spend on one life is a dollar stolen from another. History will only remember the body count.";

const BUDGET = 100_000_000;

type SimResponse = {
  total_lives_saved: number;
  total_unmet_need: number;
  remaining_budget: number;
  survival_curves: Array<{
    department: string;
    risk_tier: string;
    risk_score: number;
    points: Array<{ day: number; survival_probability: number }>;
  }>;
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [wEfficiency, setWEfficiency] = useState(0.5);
  const [wHumanity, setWHumanity] = useState(0.5);
  const [typedCount, setTypedCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [simulation, setSimulation] = useState<SimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const typedBrief = useMemo(
    () => BRIEF_TEXT.slice(0, typedCount),
    [typedCount],
  );
  const chartData = useMemo(() => {
    if (!simulation) {
      return [];
    }

    const highRiskCurves = simulation.survival_curves.filter(
      (curve) => curve.risk_tier === "high",
    );
    if (highRiskCurves.length === 0) {
      return [];
    }

    const accumulator = new Map<number, { sum: number; count: number }>();
    for (const curve of highRiskCurves) {
      for (const point of curve.points) {
        const entry = accumulator.get(point.day) ?? { sum: 0, count: 0 };
        entry.sum += point.survival_probability;
        entry.count += 1;
        accumulator.set(point.day, entry);
      }
    }

    return Array.from(accumulator.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, value]) => ({
        day,
        survival: Number.parseFloat((value.sum / value.count).toFixed(4)),
      }));
  }, [simulation]);

  useEffect(() => {
    if (step !== 2) {
      setTypedCount(0);
      return;
    }

    const interval = setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= BRIEF_TEXT.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 18);

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 4 || simulation || isFetching) {
      return;
    }

    const runSimulation = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
        const response = await fetch(`${apiBase}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            w_efficiency: wEfficiency,
            w_humanity: wHumanity,
            budget: BUDGET,
          }),
        });

        if (!response.ok) {
          throw new Error(`Simulation request failed (${response.status})`);
        }

        const payload = (await response.json()) as SimResponse;
        setSimulation(payload);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown simulation error";
        setError(message);
      } finally {
        setIsFetching(false);
      }
    };

    void runSimulation();
  }, [step, simulation, isFetching, wEfficiency, wHumanity]);

  useEffect(() => {
    if (step !== 4 || !simulation) {
      return;
    }
    const timeout = setTimeout(() => setStep(5), 1100);
    return () => clearTimeout(timeout);
  }, [step, simulation]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10 pb-24">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section
            key="step-1"
            className="flex flex-col items-start gap-8 border-4 border-black bg-[#a40d0d] p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
          >
            <h1
              className="glitch-heavy text-6xl leading-none md:text-8xl"
              data-text="PROJECT AESCLEPIUS"
            >
              PROJECT AESCLEPIUS
            </h1>
            <button className="px-7 py-4 text-lg" onClick={() => setStep(2)}>
              INITIALIZE
            </button>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="step-2"
            className="flex flex-col gap-8 border-4 border-black bg-[#a40d0d] p-8 md:p-12"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-5xl md:text-7xl">THE BRIEF</h2>
            <p className="typewriter-narrative max-w-5xl text-xl leading-relaxed md:text-2xl">
              {typedBrief}
              <span className="typewriter-cursor" />
            </p>
            <div>
              <button
                className="px-7 py-4 text-lg"
                onClick={() => setStep(3)}
                disabled={typedCount < BRIEF_TEXT.length}
              >
                CONTINUE
              </button>
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section
            key="step-3"
            className="flex flex-col gap-10 border-4 border-black bg-[#a40d0d] p-8 md:p-12"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-5xl md:text-7xl">THE WEIGHTS</h2>

            <div className="flex flex-col justify-center gap-10 md:flex-row md:gap-24">
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-2xl uppercase">Efficiency Weight</p>
                <p className="text-center text-sm uppercase tracking-widest">
                  The Many
                </p>
                <input
                  className="vertical-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={wEfficiency}
                  onChange={(event) =>
                    setWEfficiency(Number.parseFloat(event.target.value))
                  }
                />
                <p className="text-xl">{Math.round(wEfficiency * 100)}%</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-2xl uppercase">Humanity Weight</p>
                <p className="text-center text-sm uppercase tracking-widest">
                  The Sickest
                </p>
                <input
                  className="vertical-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={wHumanity}
                  onChange={(event) =>
                    setWHumanity(Number.parseFloat(event.target.value))
                  }
                />
                <p className="text-xl">{Math.round(wHumanity * 100)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="px-7 py-4 text-lg"
                onClick={() => {
                  setSimulation(null);
                  setError(null);
                  setStep(4);
                }}
              >
                LOCK IN WEIGHTS
              </button>
              <p className="text-sm uppercase tracking-wider">
                Budget: ${BUDGET.toLocaleString()}
              </p>
            </div>
          </motion.section>
        )}

        {step === 4 && (
          <motion.section
            key="step-4"
            className="flex flex-col gap-8 border-4 border-black bg-[#a40d0d] p-8 md:p-12"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="pulse-alert text-5xl leading-tight md:text-7xl">
              CALCULATING MORTALITY...
            </h2>

            {isFetching && (
              <p className="text-lg uppercase tracking-wider">
                querying /simulate endpoint
              </p>
            )}

            {error && (
              <div className="border-4 border-black bg-[#b81414] p-5">
                <p className="text-lg uppercase">Simulation Error: {error}</p>
              </div>
            )}

            {simulation && (
              <div className="grid gap-3 border-4 border-black bg-[#b81414] p-5 text-lg uppercase md:grid-cols-3">
                <p>Lives Saved: {simulation.total_lives_saved.toLocaleString()}</p>
                <p>Unmet Need: {simulation.total_unmet_need.toLocaleString()}</p>
                <p>
                  Remaining: ${simulation.remaining_budget.toLocaleString()}
                </p>
              </div>
            )}
          </motion.section>
        )}

        {step === 5 && simulation && (
          <motion.section
            key="step-5"
            className="flex flex-col gap-8 border-4 border-black bg-[#a40d0d] p-8 md:p-12"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-5xl md:text-7xl">OUTCOMES</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="border-4 border-black bg-black p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em]">Lives Covered</p>
                <p className="mt-2 text-3xl md:text-4xl">
                  {simulation.total_lives_saved.toLocaleString()}
                </p>
              </article>
              <article className="border-4 border-black bg-black p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em]">
                  Death Toll (Unmet Need)
                </p>
                <p className="mt-2 text-3xl md:text-4xl">
                  {simulation.total_unmet_need.toLocaleString()}
                </p>
              </article>
              <article className="border-4 border-black bg-black p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em]">
                  Budget Remaining
                </p>
                <p className="mt-2 text-3xl md:text-4xl">
                  ${simulation.remaining_budget.toLocaleString()}
                </p>
              </article>
            </div>

            <section className="border-4 border-black bg-black p-4 md:p-6">
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white">
                Survival Probability Over Time
              </p>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid stroke="#1f1f1f" strokeDasharray="2 3" />
                    <XAxis
                      dataKey="day"
                      type="number"
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      label={{
                        value: "Days",
                        position: "insideBottom",
                        offset: -2,
                        fill: "#ffffff",
                      }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      stroke="#ffffff"
                      tick={{ fill: "#ffffff", fontSize: 12 }}
                      tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#000000",
                        border: "2px solid #ffffff",
                        color: "#ffffff",
                      }}
                      labelStyle={{ color: "#ffffff" }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Survival"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="survival"
                      stroke="#ffffff"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="flex flex-col gap-6 border-4 border-black bg-[#b81414] p-6 md:p-8">
              <h3
                className="glitch-heavy text-6xl leading-none md:text-8xl"
                data-text="ARE YOU HAPPY?"
              >
                ARE YOU HAPPY?
              </h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 text-xl" onClick={() => setStep(1)}>
                  YES
                </button>
                <button
                  className="px-8 py-4 text-xl"
                  onClick={() => {
                    setSimulation(null);
                    setError(null);
                    setStep(3);
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            </section>
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-black bg-black px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-white md:text-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 md:gap-8">
          <a
            href="https://project-aesclepius.streamlit.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white underline-offset-4 hover:text-zinc-300"
          >
            SYSTEM SCHEMATICS (Original App)
          </a>
          <a
            href="https://github.com/Divyansh-Kamboj/Dubstech_Datathon"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white underline-offset-4 hover:text-zinc-300"
          >
            SOURCE CODE (GitHub)
          </a>
        </div>
      </footer>
    </main>
  );
}
