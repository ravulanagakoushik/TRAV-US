import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { AIAdvisory, OptimizationRun } from '../types/index.js';
import { Topbar } from '../components/layout/Topbar.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  {
    q: 'Why did the optimizer choose this assignment and route sequence?',
    type: 'route_explanation',
  },
  {
    q: 'Which deliveries are currently at risk of missing customer deadline windows?',
    type: 'delivery_risk_assessment',
  },
  {
    q: 'Which vehicles are underutilized and how can fleet workload be balanced?',
    type: 'fleet_balancing',
  },
  {
    q: 'Explain the operational consequences and risks of our latest disruption simulation.',
    type: 'disruption_analysis',
  },
  {
    q: 'Generate an executive management briefing summary for today’s dispatch.',
    type: 'management_summary',
  },
];

export const AdvisorPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [taskType, setTaskType] = useState('route_explanation');
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<AIAdvisory[]>([]);
  const [latestAdvisory, setLatestAdvisory] = useState<AIAdvisory | null>(null);

  const loadHistory = async () => {
    try {
      const hist = await api.getAdvisoryHistory();
      setHistory(hist);
      if (hist.length > 0) {
        setLatestAdvisory(hist[0]);
      }
    } catch (err) {
      console.error('Failed to load advisories', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAsk = async (qText?: string, tType?: string) => {
    const finalQ = qText || question;
    const finalType = tType || taskType;
    if (!finalQ.trim()) return;

    try {
      setAsking(true);
      const res = await api.askAdvisor({
        question: finalQ,
        taskType: finalType,
      });
      setLatestAdvisory(res);
      setHistory((prev) => [res, ...prev]);
      setQuestion('');
    } catch (err) {
      console.error('AI question failed', err);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3E8D7]">
      <Topbar title="Gemini AI Mobility Advisor" onRefresh={loadHistory} />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Advisor Intro Banner */}
        <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Grounded Fleet Decision Intelligence
              </div>
              <h2 className="text-xl font-bold text-[#382719]">
                Gemini Operational Explanations & Next Actions
              </h2>
              <p className="text-xs text-[#7A624E] mt-1 max-w-2xl">
                Every advisory is strictly grounded in actual calculated backend optimizer metrics, capacity limits, and disruption simulator models.
              </p>
            </div>
          </div>

          {/* Suggested Questions Grid */}
          <div className="mt-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A624E]">
              Suggested Operations Inquiries
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SUGGESTED_QUESTIONS.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(sq.q);
                    setTaskType(sq.type);
                    handleAsk(sq.q, sq.type);
                  }}
                  className="group p-3 text-left rounded-xl bg-[#F3E8D7]/60 hover:bg-[#F3E8D7] border border-[#E2D1BC] text-xs font-semibold text-[#382719] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md hover:border-[#A66B38] flex items-start gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#A66B38] shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-115 group-hover:rotate-6" />
                  <span className="leading-snug group-hover:text-[#5B3925] transition-colors">{sq.q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Question Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="mt-5 flex gap-3"
          >
            <input
              type="text"
              placeholder="Ask RouteRescue AI (e.g. Why did vehicle Sprinter Bravo receive 8 stops?)..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-[#E2D1BC] rounded-xl text-xs text-[#382719] focus:outline-none focus:ring-2 focus:ring-[#5B3925] focus:scale-[1.005] hover:border-[#A66B38] transition-all duration-200 shadow-sm"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="group px-6 py-3 bg-[#5B3925] text-white hover:bg-[#382416] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-lg hover:shadow-[#5B3925]/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              <span>{asking ? 'Analyzing Fleet...' : 'Consult Advisor'}</span>
            </button>
          </form>
        </div>

        {/* Latest Advisory Response View */}
        {latestAdvisory && (
          <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-6 shadow-warm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E2D1BC] gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A624E]">
                  Inquiry:
                </span>
                <h3 className="font-bold text-base text-[#382719] mt-0.5">
                  "{latestAdvisory.question}"
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    latestAdvisory.provider === 'gemini'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {latestAdvisory.provider === 'gemini' ? '✨ Powered by Gemini' : '⚡ Grounded Heuristic Advisor'}
                </span>
                <span className="text-xs text-[#7A624E]">
                  {new Date(latestAdvisory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Structured Advisory Content */}
            <div className="space-y-4">
              {/* Executive Summary */}
              {latestAdvisory.response.summary && (
                <div className="p-4 bg-[#F3E8D7]/60 rounded-xl border border-[#E2D1BC]">
                  <h4 className="font-bold text-xs text-[#5B3925] uppercase tracking-wider mb-1">
                    Operational Executive Summary
                  </h4>
                  <p className="text-sm font-semibold text-[#382719] leading-relaxed">
                    {latestAdvisory.response.summary}
                  </p>
                </div>
              )}

              {/* Key Factors or Imbalances */}
              {latestAdvisory.response.key_factors && (
                <div>
                  <h4 className="font-bold text-xs text-[#382719] mb-2">Key Operational Factors</h4>
                  <ul className="space-y-1.5 text-xs text-[#382719]">
                    {latestAdvisory.response.key_factors.map((kf: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{kf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* At-Risk Deliveries List */}
              {latestAdvisory.response.at_risk_deliveries && latestAdvisory.response.at_risk_deliveries.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-[#382719] mb-2">Delivery SLA Risk Breakdown</h4>
                  <div className="space-y-2">
                    {latestAdvisory.response.at_risk_deliveries.map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-white border border-[#E2D1BC] rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>Delivery Reference: {d.delivery_id}</span>
                          <StatusBadge status={d.risk_level} type="risk" />
                        </div>
                        <div className="text-amber-900 font-medium">{d.reason}</div>
                        <div className="text-[#5B3925]">Action: {d.recommended_action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade-offs & Limitations */}
              {latestAdvisory.response.tradeoffs && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-[#E2D1BC] rounded-xl text-xs">
                    <h5 className="font-bold text-[#5B3925] mb-2">Operational Trade-Offs</h5>
                    <ul className="space-y-1 text-[#7A624E]">
                      {latestAdvisory.response.tradeoffs.map((t: string, i: number) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-white border border-[#E2D1BC] rounded-xl text-xs">
                    <h5 className="font-bold text-[#5B3925] mb-2">Modeling Assumptions & Limits</h5>
                    <ul className="space-y-1 text-[#7A624E]">
                      {latestAdvisory.response.limitations?.map((l: string, i: number) => (
                        <li key={i}>• {l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Recommended Next Actions */}
              {latestAdvisory.response.next_actions && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider mb-2">
                    Recommended Next Actions for Dispatcher
                  </h4>
                  <div className="space-y-1.5 text-xs text-emerald-900 font-medium">
                    {latestAdvisory.response.next_actions.map((na: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{na}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
