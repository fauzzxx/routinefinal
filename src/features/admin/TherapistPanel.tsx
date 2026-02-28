import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRewards } from "@/contexts/RewardContext";
import { computeAnalytics } from "@/utils/analyticsEngine";
import {
  computeTherapyRecommendations,
  generateWeeklyReportParagraph,
  type TherapyRecommendationResult,
} from "@/utils/therapyEngine";
import { ArrowLeft, FileDown, AlertCircle, CheckCircle2 } from "lucide-react";

function getDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function downloadReportAsPdf(
  analytics: ReturnType<typeof computeAnalytics>,
  therapy: TherapyRecommendationResult,
  dateRange: { start: string; end: string }
): void {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Weekly Behavioral Report", margin, y);
    y += 12;

    doc.setFontSize(11);
    doc.text(`Date range: ${dateRange.start} to ${dateRange.end}`, margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Metrics summary", margin, y);
    y += 8;
    doc.setFontSize(10);
    const metrics = [
      `Total tasks completed: ${analytics.totalTasksCompleted}`,
      `Total tasks attempted: ${analytics.totalTasksAttempted}`,
      `Completion rate: ${analytics.completionPercentage}%`,
      `Current streak: ${analytics.currentStreak} days`,
      `7-day trend: ${analytics.sevenDayTrend}`,
    ];
    if (analytics.mostFailedTask) {
      metrics.push(
        `Most difficult task: ${analytics.mostFailedTask.taskName} (${analytics.mostFailedTask.failureCount} failures)`
      );
    }
    metrics.forEach((line) => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 6;

    doc.setFontSize(12);
    doc.text("Recommendations", margin, y);
    y += 8;
    doc.setFontSize(10);
    therapy.recommendations.forEach((rec) => {
      const lines = doc.splitTextToSize(rec, maxWidth);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 2;
    });
    y += 4;
    doc.text(`Risk level: ${therapy.riskLevel}`, margin, y);

    doc.save("weekly-behavioral-report.pdf");
  });
}

export default function TherapistPanel() {
  const navigate = useNavigate();
  const { streak } = useRewards();
  const [reportParagraph, setReportParagraph] = useState<string | null>(null);

  const analytics = useMemo(() => computeAnalytics(streak), [streak]);
  const therapy = useMemo(
    () => computeTherapyRecommendations(analytics),
    [analytics]
  );
  const dateRange = useMemo(() => getDateRange(), []);

  const handleGenerateReport = () => {
    const paragraph = generateWeeklyReportParagraph(analytics, therapy, dateRange);
    setReportParagraph(paragraph);
  };

  const handleDownloadPdf = () => {
    downloadReportAsPdf(analytics, therapy, dateRange);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white font-inter pb-20">
        <Navigation />

        <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-fredoka text-slate-900">
                AI Therapist Assistant
              </h1>
              <p className="text-slate-500 text-sm">Rule-based recommendations from analytics</p>
            </div>
          </div>

          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden mb-6">
            <CardHeader>
              <CardTitle className="font-fredoka text-lg text-slate-900">Recommendations</CardTitle>
              <CardDescription>Based on completion rate, failures, streak, and 7-day trend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full shrink-0 ${
                    therapy.riskLevel === "High"
                      ? "bg-red-500"
                      : therapy.riskLevel === "Moderate"
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="font-medium text-slate-700">Risk level: {therapy.riskLevel}</span>
              </div>
              <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                {therapy.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden mb-6">
            <CardHeader>
              <CardTitle className="font-fredoka text-lg text-slate-900">Weekly Report</CardTitle>
              <CardDescription>Generate and download a summary report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="default"
                className="rounded-xl min-h-[40px]"
                onClick={handleGenerateReport}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Generate Weekly Report
              </Button>
              {reportParagraph && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap break-words">
                  {reportParagraph}
                </div>
              )}
              <Button
                variant="outline"
                className="rounded-xl min-h-[40px]"
                onClick={handleDownloadPdf}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Report as PDF
              </Button>
            </CardContent>
          </Card>

          {!analytics.hasData && (
            <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 overflow-hidden">
              <CardContent className="p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  No analytics data yet. Use the Parent Analytics dashboard after some routine practice to see recommendations here.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
