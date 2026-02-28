import { Sparkles } from "lucide-react";

export interface FlashcardIntelligenceSnippetProps {
  stepIndex?: number;
  totalSteps?: number;
  /** Optional: time on card in seconds for simulated response time */
  timeOnCardSec?: number;
  /** Optional: actual test score from a completed test session */
  testScore?: number;
  className?: string;
}

function deriveRecallStrength(score?: number, step?: number, total?: number): string {
  if (score !== undefined) {
    if (score >= 90) return "Expert";
    if (score >= 75) return "Strong";
    if (score >= 50) return "Medium";
    return "Building";
  }
  if (step === undefined || total === undefined || total <= 0) return "Medium";
  const pct = (step / total) * 100;
  if (pct < 33) return "Building";
  if (pct < 66) return "Medium";
  return "Strong";
}

function deriveRetentionPrediction(score?: number, step?: number, total?: number): number {
  if (score !== undefined) {
    return Math.min(99, Math.round(score * 0.9 + 10));
  }
  if (step === undefined || total === undefined || total <= 0) return 75;
  return Math.min(95, 70 + Math.round((step / total) * 25) + (step % 2 === 0 ? 3 : 0));
}

function deriveResponseTimeMessage(timeSec?: number): string {
  if (timeSec === undefined) return "AI monitoring focus";
  if (timeSec < 5) return "Lightning-fast recall!";
  if (timeSec < 15) return "Steady and focused response";
  return "Taking your time—quality over speed";
}

/**
 * Flashcard flow: adaptive intelligence signals.
 * Uses test scores if available, else falls back to simulated progress.
 */
export function FlashcardIntelligenceSnippet({
  stepIndex,
  totalSteps,
  timeOnCardSec,
  testScore,
  className = "",
}: FlashcardIntelligenceSnippetProps) {
  const recall = deriveRecallStrength(testScore, stepIndex, totalSteps);
  const retention = deriveRetentionPrediction(testScore, stepIndex, totalSteps);
  const responseMsg = deriveResponseTimeMessage(timeOnCardSec);

  return (
    <div className={`text-xs text-muted-foreground space-y-1.5 ${className}`}>
      <p className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 shrink-0 text-primary/70" />
        <span>{responseMsg}</span>
      </p>
      <p>
        Recall strength: <span className="font-medium text-foreground">{recall}</span>
        {" · "}
        Memory retention prediction: <span className="font-medium text-foreground">{retention}%</span>
      </p>
      <p className="italic">
        {testScore !== undefined
          ? "Based on your latest test results."
          : "Smart suggestion: Revisit this card tomorrow for best retention."}
      </p>
    </div>
  );
}
