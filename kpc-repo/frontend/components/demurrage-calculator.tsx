"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

interface CalcResult {
  total_turnaround_mins: number;
  billable_demurrage_hours: number;
  is_in_demurrage: boolean;
  demurrage_base_charge: number;
  tax_amount: number;
  total_charge: number;
  currency: string;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

export function DemurrageCalculator() {
  const [hoursAtTerminal, setHoursAtTerminal] = useState(4.5);
  const [freeTimeHours, setFreeTimeHours] = useState(2);
  const [ratePerHour, setRatePerHour] = useState(11000);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    try {
      const gateIn = new Date("2026-09-12T08:00:00");
      const gateOut = new Date(gateIn.getTime() + hoursAtTerminal * 3600 * 1000);
      const res = await api.post<CalcResult>(
        "/api/v1/calculate",
        {
          movement_id: "WEB-ESTIMATE",
          truck_plate: "ESTIMATE",
          gate_in: gateIn.toISOString(),
          gate_out: gateOut.toISOString(),
          contract_id: "ESTIMATE",
          contract_code: "ESTIMATE",
          free_time_mins: Math.round(freeTimeHours * 60),
          grace_period_mins: 15,
          grace_cliff: false,
          demurrage_rate_per_hr: ratePerHour,
          detention_rate_per_day: ratePerHour * 4,
          detention_threshold_mins: 1440,
          rounding_increment_mins: 60,
          rounding_mode: "ceil",
          tax_rate: 0.05,
          currency: "KES",
        },
        { auth: false }
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the calculation engine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 rounded-2xl border border-kpc-gray-200 bg-white p-8 shadow-sm lg:grid-cols-2 lg:p-10">
      <div>
        <h3 className="text-xl font-semibold text-kpc-gray-900">
          Estimate a demurrage charge
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-kpc-gray-600">
          Enter how long a truck sits at the gantry and your contract&apos;s
          free time, and the same 12-step engine that bills every OMC will
          work out the charge.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="hours" className="font-medium text-kpc-gray-800">
                Time at the terminal
              </label>
              <span className="tabular-nums text-kpc-gray-600">{hoursAtTerminal.toFixed(1)} hrs</span>
            </div>
            <input
              id="hours"
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={hoursAtTerminal}
              onChange={(e) => setHoursAtTerminal(Number(e.target.value))}
              className="mt-2 w-full accent-kpc-red"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="freetime" className="font-medium text-kpc-gray-800">
                Contract free time
              </label>
              <span className="tabular-nums text-kpc-gray-600">{freeTimeHours.toFixed(1)} hrs</span>
            </div>
            <input
              id="freetime"
              type="range"
              min={0.5}
              max={6}
              step={0.5}
              value={freeTimeHours}
              onChange={(e) => setFreeTimeHours(Number(e.target.value))}
              className="mt-2 w-full accent-kpc-red"
            />
          </div>

          <div>
            <label htmlFor="rate" className="text-sm font-medium text-kpc-gray-800">
              Hourly demurrage rate (KES)
            </label>
            <input
              id="rate"
              type="number"
              min={0}
              step={500}
              value={ratePerHour}
              onChange={(e) => setRatePerHour(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-kpc-gray-300 px-3 py-2 text-sm focus:border-kpc-red focus:outline-none focus:ring-1 focus:ring-kpc-red"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full rounded-full bg-kpc-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-kpc-red-hover disabled:opacity-60"
          >
            {loading ? "Calculating…" : "Calculate charge"}
          </button>
          {error && <p className="text-sm text-kpc-red">{error}</p>}
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-xl bg-kpc-gray-50 p-8">
        {!result ? (
          <p className="text-sm text-kpc-gray-500">
            Your estimate will appear here once you calculate.
          </p>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-kpc-gray-600">Estimated charge</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-kpc-gray-900">
                KES {money(result.total_charge)}
              </p>
            </div>
            <dl className="space-y-2 border-t border-kpc-gray-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-kpc-gray-600">Turnaround time</dt>
                <dd className="tabular-nums text-kpc-gray-900">
                  {Math.round(result.total_turnaround_mins / 60 * 10) / 10} hrs
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kpc-gray-600">Billable hours</dt>
                <dd className="tabular-nums text-kpc-gray-900">{result.billable_demurrage_hours} hrs</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kpc-gray-600">Base charge</dt>
                <dd className="tabular-nums text-kpc-gray-900">KES {money(result.demurrage_base_charge)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kpc-gray-600">Tax (5%)</dt>
                <dd className="tabular-nums text-kpc-gray-900">KES {money(result.tax_amount)}</dd>
              </div>
            </dl>
            {!result.is_in_demurrage && (
              <p className="rounded-lg bg-kpc-success-soft px-3 py-2 text-sm text-kpc-success">
                Within free time - no demurrage charge applies.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
