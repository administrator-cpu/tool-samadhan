"use client";

export default function SupportGuidelinesPage() {
  return (
    <div className="mx-auto max-w-7xl flex-col gap-10 px-6 py-10 md:px-12 md:py-14">
      <div className="flex items-center gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Support Guidelines
          </h1>
          <p className="text-slate-500 mt-1">
            Understanding our SLA commitments and escalation procedures.
          </p>
        </div>
      </div>

      {/* Support SLA Guidelines */}
      <section className="flex flex-col gap-6 mt-10 max-w-7xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-indigo-600">policy</span>
          <h3
            className="text-2xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Severity Levels
          </h3>
        </div>

        {/* Severity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Critical */}
          <div className="group relative flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <span className="material-symbols-outlined">error</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-outfit">Critical</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 mt-1">
              Complete service outage or business-critical functionality unavailable. No workaround exists.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</span>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Immediate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution</span>
                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">2-4 hours</span>
              </div>
            </div>
          </div>

          {/* Medium */}
          <div className="group relative flex flex-col gap-3 rounded-2xl  bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-outfit">Medium</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 mt-1">
              Partial service degradation or issue affecting a limited number of users. Workaround available.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</span>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Immediate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution</span>
                <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">4-6 hours</span>
              </div>
            </div>
          </div>

          {/* Low */}
          <div className="group relative flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <span className="material-symbols-outlined">info</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-outfit">Low</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 mt-1">
              Minor issue, cosmetic defect, or information request. No significant business impact.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</span>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Immediate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution</span>
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Matrix Table */}
        <div className="mt-8">
           <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-indigo-600">timeline</span>
            <h3
              className="text-2xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Escalation Matrix
            </h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Escalation Level</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Owner</th>
                    <th className="px-6 py-4 font-semibold min-w-[250px]">Responsibility</th>
                    <th className="px-6 py-4 font-semibold min-w-[200px]">Escalation Trigger</th>
                    <th className="px-6 py-4 font-semibold min-w-[220px]">Communication Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* L1 */}
                  <tr className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-3 py-1 font-bold text-indigo-700 font-outfit">L1</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        </div>
                        <div className="font-semibold text-slate-900 whitespace-nowrap">Samadhan AI Agent</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      Ticket creation, initial troubleshooting, customer acknowledgement, regular status updates, coordination with field/vendor teams.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Immediately upon incident logging.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Initial acknowledgement within <span className="font-bold text-slate-800">15 minutes</span>, then updates every <span className="font-bold text-slate-800">30–60 minutes</span>.
                    </td>
                  </tr>

                  {/* L2 */}
                  <tr className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center justify-center rounded-lg bg-orange-50 px-3 py-1 font-bold text-orange-700 font-outfit">L2</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">engineering</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 whitespace-nowrap">NOC Head</div>
                          <a href="mailto:noc.head@fab5network.com" className="text-xs text-indigo-600 hover:underline">noc.head@fab5network.com</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      Review technical progress, allocate additional resources, coordinate with OEM/vendors, drive incident resolution, monitor SLA compliance.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Incident remains unresolved for <span className="font-bold text-rose-600">4 hours</span> or MTTR is at risk.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Updates to customer and management every <span className="font-bold text-slate-800">30-60 minutes</span> until restoration.
                    </td>
                  </tr>

                  {/* L3 */}
                  <tr className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center justify-center rounded-lg bg-rose-50 px-3 py-1 font-bold text-rose-700 font-outfit">L3</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 whitespace-nowrap">Operations Head</div>
                          <a href="mailto:operation.head@fab5network.com" className="text-xs text-indigo-600 hover:underline">operation.head@fab5network.com</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      Executive ownership, cross-functional coordination, customer executive communication, resource prioritization, management escalation, and final decision-making.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Incident remains unresolved for <span className="font-bold text-rose-600">6 hours</span>, MTTR is breached, or incident is business-critical.
                    </td>
                    <td className="px-6 py-5 align-top">
                      Executive updates every <span className="font-bold text-slate-800">30-60 minutes</span> until service restoration and RCA initiation.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
