'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send, Loader2, Bot, User, Search, Brain,
  ChevronRight, ChevronDown, CheckCircle2, Database, AlertCircle,
  ImagePlus, X, ScanEye,
} from 'lucide-react';
import type { Language } from './LanguageToggle';
import { ImageUploadModal } from './ImageUploadModal';
import { VlmWarmupModal } from './VlmWarmupModal';

const VLM_RETRY_MAX = 5;
const VLM_RETRY_DELAY_MS = 10_000;

interface AgentStep {
  type: 'reasoning' | 'tool_call' | 'tool_progress' | 'tool_result' | 'vlm_analysis';
  reasoning?: string;
  analysis?: string;
  tool_id?: string;
  tool_call_id?: string;
  params?: Record<string, unknown>;
  message?: string;
  results?: unknown[];
  isError?: boolean;
}

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  imageUrl?: string;
  steps?: AgentStep[];
  status?: 'thinking' | 'searching' | 'typing' | 'complete';
}

function StepIcon({ step, isActive }: { step: AgentStep; isActive?: boolean }) {
  switch (step.type) {
    case 'reasoning':
      return <Brain className="w-3 h-3 text-slate-500 flex-shrink-0" />;
    case 'tool_call':
      return <Search className="w-3 h-3 text-amber-400 flex-shrink-0" />;
    case 'tool_progress':
      return isActive
        ? <Loader2 className="w-3 h-3 text-slate-500 animate-spin flex-shrink-0" />
        : <CheckCircle2 className="w-3 h-3 text-slate-600 flex-shrink-0" />;
    case 'tool_result':
      return step.isError
        ? <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
        : <Database className="w-3 h-3 text-green-400 flex-shrink-0" />;
    case 'vlm_analysis':
      return <ScanEye className="w-3 h-3 text-amber-400 flex-shrink-0" />;
  }
}

function getErrorMessage(results?: unknown[]): string {
  if (!results?.length) return 'Unknown error';
  const first = results[0] as { data?: { message?: string } };
  return first?.data?.message || 'Unknown error';
}

function formatResultsSummary(results?: unknown[]): string {
  if (!results?.length) return 'No results';
  const items = results.filter((r) => (r as { type?: string }).type !== 'error');
  if (!items.length) return 'No results';
  return `${items.length} result${items.length !== 1 ? 's' : ''} returned`;
}

interface StepRowProps {
  step: AgentStep;
  stepKey: string;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: (key: string) => void;
}

function StepRow({ step, stepKey, isExpanded, isActive, onToggle }: StepRowProps) {
  switch (step.type) {
    case 'reasoning':
      return (
        <div className="flex items-start gap-2 py-1">
          <StepIcon step={step} isActive={isActive} />
          <span className="text-xs text-slate-500 italic leading-relaxed">{step.reasoning}</span>
        </div>
      );
    case 'tool_call':
      return (
        <div className="py-1">
          <button
            onClick={() => onToggle(stepKey)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {isExpanded
              ? <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
              : <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            }
            <StepIcon step={step} isActive={isActive} />
            <span className="text-xs text-amber-400 group-hover:text-amber-300 transition-colors">
              {step.tool_id}: <span className="text-slate-400">{step.params?.nlQuery as string || 'query'}</span>
            </span>
          </button>
          {isExpanded && (
            <pre className="mt-1 ml-5 bg-slate-900/50 rounded p-2 text-xs text-slate-400 font-mono overflow-x-auto">
              {JSON.stringify(step.params, null, 2)}
            </pre>
          )}
        </div>
      );
    case 'tool_progress':
      return (
        <div className="flex items-start gap-2 py-1">
          <StepIcon step={step} isActive={isActive} />
          <span className="text-xs text-slate-500">{step.message}</span>
        </div>
      );
    case 'tool_result':
      return (
        <div className="py-1">
          <button
            onClick={() => onToggle(stepKey)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {isExpanded
              ? <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
              : <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            }
            <StepIcon step={step} isActive={isActive} />
            <span className={`text-xs group-hover:brightness-125 transition-all ${step.isError ? 'text-red-400' : 'text-green-400'}`}>
              {step.isError ? `Error: ${getErrorMessage(step.results)}` : formatResultsSummary(step.results)}
            </span>
          </button>
          {isExpanded && (
            <pre className={`mt-1 ml-5 rounded p-2 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto scrollbar-dark ${
              step.isError ? 'bg-red-950/30 text-red-300' : 'bg-slate-900/50 text-slate-400'
            }`}>
              {JSON.stringify(step.results, null, 2)}
            </pre>
          )}
        </div>
      );
    case 'vlm_analysis': {
      const text = step.analysis || '';
      const preview = text.length > 120 ? text.slice(0, 120) + '...' : text;
      return (
        <div className="py-1">
          <button
            onClick={() => onToggle(stepKey)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {isExpanded
              ? <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
              : <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            }
            <StepIcon step={step} isActive={isActive} />
            <span className="text-xs text-amber-400 group-hover:text-amber-300 transition-colors">
              VLM Architecture Analysis
              {!isExpanded && <span className="text-slate-500 ml-1.5">{preview}</span>}
            </span>
          </button>
          {isExpanded && (
            <div className="mt-1 ml-5 bg-amber-500/5 border border-amber-500/15 rounded p-2 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto scrollbar-dark">
              {text}
            </div>
          )}
        </div>
      );
    }
  }
}

function getStatusLabel(steps: AgentStep[], status?: string): string {
  if (status === 'complete' || !status) {
    const meaningful = steps.filter(s => s.type === 'reasoning' || s.type === 'tool_call' || s.type === 'vlm_analysis');
    return `Completed ${meaningful.length} step${meaningful.length !== 1 ? 's' : ''}`;
  }
  const last = steps[steps.length - 1];
  if (last?.type === 'tool_progress' && last.message) return last.message;
  if (last?.type === 'tool_call') return `Searching: ${last.params?.nlQuery || last.tool_id}`;
  if (last?.type === 'vlm_analysis') return 'Diagram analyzed by VLM';
  if (last?.type === 'reasoning' && last.reasoning) {
    const text = last.reasoning;
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }
  return status === 'searching' ? 'Searching EU AI Act...' : 'Thinking...';
}

export function AgentChat({ language }: { language: Language }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [vlmWarming, setVlmWarming] = useState(false);
  const [vlmAttempt, setVlmAttempt] = useState(0);
  const [stepsExpanded, setStepsExpanded] = useState<Record<number, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleImageFile = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setShowImageModal(false);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleSteps = (idx: number) => {
    setStepsExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStepDetail = (key: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateAgentMessage = (
    content: string,
    steps: AgentStep[],
    status: ChatMessage['status'],
  ) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: 'agent',
        content,
        steps: [...steps],
        status,
      };
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    const hasImage = !!imageFile;
    if ((!trimmed && !hasImage) || isLoading) return;

    const currentImage = imageFile;
    const currentPreview = imagePreview;
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setErrorExpanded(false);

    const agentMsgIdx = messages.length + 1;
    setStepsExpanded(prev => ({ ...prev, [agentMsgIdx]: true }));

    setMessages(prev => [...prev, {
      role: 'user',
      content: trimmed,
      imageUrl: currentPreview || undefined,
    }]);
    setIsLoading(true);

    try {
      let agentMessage = trimmed;
      let vlmAnalysisText: string | null = null;

      if (currentImage) {
        setIsAnalyzingImage(true);
        const formData = new FormData();
        formData.append('image', currentImage);

        let visionResp = await fetch('/api/vision', {
          method: 'POST',
          body: formData,
        });

        if (!visionResp.ok) {
          const errData = await visionResp.json().catch(() => ({ error: 'Vision analysis failed.' }));

          if (errData.coldStart) {
            setVlmWarming(true);

            for (let attempt = 1; attempt <= VLM_RETRY_MAX; attempt++) {
              setVlmAttempt(attempt);
              await new Promise(r => setTimeout(r, VLM_RETRY_DELAY_MS));

              const retryForm = new FormData();
              retryForm.append('image', currentImage);
              visionResp = await fetch('/api/vision', {
                method: 'POST',
                body: retryForm,
              });

              if (visionResp.ok) break;

              const retryData = await visionResp.json().catch(() => ({ error: 'Vision analysis failed.' }));
              if (!retryData.coldStart) {
                setVlmWarming(false);
                setIsAnalyzingImage(false);
                throw new Error(retryData.error || `Vision analysis failed (${visionResp.status})`);
              }
            }

            setVlmWarming(false);

            if (!visionResp.ok) {
              setIsAnalyzingImage(false);
              throw new Error(
                `Vision AI service did not respond after ${VLM_RETRY_MAX} retries.`,
              );
            }
          } else {
            setIsAnalyzingImage(false);
            throw new Error(errData.error || `Vision analysis failed (${visionResp.status})`);
          }
        }

        setIsAnalyzingImage(false);

        const { analysis } = await visionResp.json();
        if (!analysis) throw new Error('Vision model returned an empty response.');

        vlmAnalysisText = analysis;
        agentMessage = trimmed
          ? `[Architecture Diagram Analysis]\n${analysis}\n\n[User Question]\n${trimmed}`
          : `[Architecture Diagram Analysis]\n${analysis}\n\nAnalyze this system architecture for EU AI Act compliance risks.`;
      }

      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: agentMessage, conversationId, language }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Request failed.' }));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) {
        throw new Error('No response stream.');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let agentText = '';
      let buffer = '';
      let currentEventType = '';
      const steps: AgentStep[] = [];
      let currentStatus: ChatMessage['status'] = 'thinking';

      if (vlmAnalysisText) {
        steps.push({ type: 'vlm_analysis', analysis: vlmAnalysisText });
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: '',
        steps: [...steps],
        status: 'thinking',
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const envelope = JSON.parse(raw);
            const payload = envelope.data || envelope;

            if (currentEventType === 'conversation_id_set' && payload.conversation_id) {
              setConversationId(payload.conversation_id);
            }

            if (currentEventType === 'reasoning' && payload.reasoning) {
              steps.push({ type: 'reasoning', reasoning: payload.reasoning });
              currentStatus = 'thinking';
              updateAgentMessage(agentText, steps, currentStatus);
            }

            if (currentEventType === 'tool_call') {
              steps.push({
                type: 'tool_call',
                tool_call_id: payload.tool_call_id,
                tool_id: payload.tool_id,
                params: payload.params,
              });
              currentStatus = 'searching';
              updateAgentMessage(agentText, steps, currentStatus);
            }

            if (currentEventType === 'tool_progress' && payload.message) {
              steps.push({ type: 'tool_progress', message: payload.message });
              updateAgentMessage(agentText, steps, currentStatus);
            }

            if (currentEventType === 'tool_result') {
              const hasError = payload.results?.some(
                (r: { type?: string }) => r.type === 'error'
              );
              steps.push({
                type: 'tool_result',
                tool_call_id: payload.tool_call_id,
                tool_id: payload.tool_id,
                results: payload.results,
                isError: hasError,
              });
              updateAgentMessage(agentText, steps, currentStatus);
            }

            if (currentEventType === 'message_chunk' && payload.text_chunk) {
              agentText += payload.text_chunk;
              currentStatus = 'typing';
              updateAgentMessage(agentText, steps, currentStatus);
            }

            if (currentEventType === 'error') {
              setError({ message: payload.message || 'An error occurred.', detail: JSON.stringify(payload, null, 2) });
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }

      currentStatus = 'complete';
      updateAgentMessage(agentText, steps, currentStatus);
      setStepsExpanded(prev => ({ ...prev, [agentMsgIdx]: false }));

      if (!agentText) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: 'I received your message but could not generate a response. Please try again.',
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Agent chat error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
        detail: err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err),
      });
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'agent' && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-dark">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">
              {language === 'de' ? 'EU-KI-Gesetz Compliance-Berater' : 'EU AI Act Compliance Advisor'}
            </p>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              {language === 'de'
                ? 'Fragen Sie mich zum EU-KI-Gesetz. Ich durchsuche die Verordnung und zitiere die relevanten Artikel.'
                : 'Ask me anything about the EU AI Act. I\u2019ll search the regulation and cite specific articles in my response.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg mx-auto">
              {([
                { en: 'What are the prohibited AI practices?', de: 'Welche KI-Praktiken sind verboten?' },
                { en: 'Explain high-risk AI system requirements', de: 'Welche Anforderungen gelten für Hochrisiko-KI-Systeme?' },
                { en: 'What penalties does the Act impose?', de: 'Welche Strafen sieht das Gesetz vor?' },
              ] as const).map((pair) => (
                <button
                  key={pair.en}
                  onClick={() => { setInput(pair[language]); }}
                  title={language === 'de' ? pair.en : undefined}
                  className="px-3 py-1.5 rounded-full text-xs
                             bg-slate-800 border border-slate-700 text-slate-400
                             hover:border-amber-500/50 hover:text-amber-300
                             transition-all duration-200"
                >
                  {pair[language]}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'agent' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
            )}

            {msg.role === 'agent' ? (
              <div className="max-w-[75%] space-y-2">
                {/* Collapsible thinking steps */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSteps(i)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400
                                 hover:bg-slate-700/30 transition-colors"
                    >
                      {stepsExpanded[i]
                        ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        : <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      }
                      {msg.status === 'complete' ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>{getStatusLabel(msg.steps, msg.status)}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400 flex-shrink-0" />
                          <span className="truncate">{getStatusLabel(msg.steps, msg.status)}</span>
                        </span>
                      )}
                    </button>

                    {stepsExpanded[i] && (
                      <div className="border-t border-slate-700/50 px-3 py-2 space-y-0.5 max-h-64 overflow-y-auto scrollbar-dark">
                        {msg.steps.map((step, si) => (
                          <StepRow
                            key={si}
                            step={step}
                            stepKey={`${i}-${si}`}
                            isExpanded={expandedSteps.has(`${i}-${si}`)}
                            isActive={si === msg.steps!.length - 1 && msg.status !== 'complete'}
                            onToggle={toggleStepDetail}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Only show thinking spinner when no steps have arrived yet */}
                {(!msg.steps || msg.steps.length === 0) && !msg.content && msg.status !== 'complete' && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}

                {/* Agent message content */}
                {msg.content && (
                  <div className="rounded-xl px-4 py-3 text-sm leading-relaxed
                                  bg-slate-800/70 border border-slate-700/50 text-slate-300
                                  agent-markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed
                              bg-amber-500/15 border border-amber-500/25 text-slate-200">
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded diagram"
                    className="max-w-full max-h-48 rounded-lg mb-2 border border-amber-500/20"
                  />
                )}
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
            )}

            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* VLM analyzing indicator */}
      {isAnalyzingImage && (
        <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing architecture diagram...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm overflow-hidden">
          <div className="p-3 text-red-300 text-center">
            {error.message}
          </div>
          {error.detail && (
            <>
              <button
                onClick={() => setErrorExpanded(prev => !prev)}
                className="w-full py-1.5 text-xs text-red-400 hover:text-red-300
                           border-t border-red-500/20 transition-colors"
              >
                {errorExpanded ? 'hide details' : 'expand for details'}
              </button>
              {errorExpanded && (
                <pre className="px-3 pb-3 text-xs text-slate-400 font-mono whitespace-pre-wrap break-all
                                border-t border-red-500/20 bg-slate-900/50">
                  {error.detail}
                </pre>
              )}
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div className="pt-4 border-t border-slate-800">
        {imagePreview && (
          <div className="mb-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Selected diagram"
                  className="h-20 rounded-lg border border-slate-700"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-700 hover:bg-red-600
                             flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-slate-300" />
                </button>
              </div>
              <span className="text-xs text-slate-500 mt-1">Architecture diagram attached</span>
            </div>
            {!isLoading && (
              <div className="flex flex-wrap gap-1.5">
                {([
                  { en: 'Are there any prohibited AI practices in this architecture?', de: 'Gibt es verbotene KI-Praktiken in dieser Architektur?' },
                  { en: 'What high-risk AI requirements apply to this system?', de: 'Welche Hochrisiko-KI-Anforderungen gelten für dieses System?' },
                  { en: 'What transparency obligations does this system trigger?', de: 'Welche Transparenzpflichten löst dieses System aus?' },
                ] as const).map((pair) => (
                  <button
                    key={pair.en}
                    type="button"
                    onClick={() => setInput(pair[language])}
                    title={language === 'de' ? pair.en : undefined}
                    className="px-2.5 py-1 rounded-full text-xs
                               bg-slate-800 border border-slate-700 text-slate-400
                               hover:border-amber-500/50 hover:text-amber-300
                               transition-all duration-200"
                  >
                    {pair[language]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            disabled={isLoading}
            title="Upload architecture diagram for VLM analysis"
            className="bg-slate-800 border border-slate-700 hover:border-amber-500/50
                       text-slate-400 hover:text-amber-300 disabled:opacity-50
                       px-3 py-3 rounded-xl transition-all duration-200
                       disabled:cursor-not-allowed"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={imageFile
              ? (language === 'de' ? 'Frage zu diesem Diagramm (optional)...' : 'Ask about this diagram (optional)...')
              : (language === 'de' ? 'Frage zum EU-KI-Gesetz...' : 'Ask about the EU AI Act...')}
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl
                       px-4 py-3 text-sm text-slate-100 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                       disabled:opacity-50 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageFile)}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700
                       text-slate-900 disabled:text-slate-500
                       px-4 py-3 rounded-xl transition-all duration-200
                       disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onFile={handleImageFile}
        />

        <VlmWarmupModal isOpen={vlmWarming} attempt={vlmAttempt} maxAttempts={VLM_RETRY_MAX} />
      </div>
    </div>
  );
}
