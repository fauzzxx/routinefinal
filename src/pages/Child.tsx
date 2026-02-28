// Version: 1.0.1 - Forced build
import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Volume2, Play, ChevronLeft, ChevronRight, Video, Film, Award, ShoppingBag, Coins, Star, Flame, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestGenerateAnimation } from "@/integrations/ai/video";
import { demoStore } from "@/integrations/demo/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { useRewards } from "@/contexts/RewardContext";
import { WebcamComponent } from "@/components/webcam/WebcamComponent";
import { SessionSummaryCard } from "@/components/intelligence/SessionSummaryCard";
import { EngagementSnippet } from "@/components/intelligence/EngagementSnippet";
import { AITipSnippet } from "@/components/intelligence/AITipSnippet";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";
import { FlashcardIntelligenceSnippet } from "@/components/intelligence/FlashcardIntelligenceSnippet";
import { IntelligenceBadge } from "@/components/intelligence/IntelligenceBadge";
import { RoutineIntelligenceIndicator } from "@/components/intelligence/RoutineIntelligenceIndicator";
import { ProgressAnalyticsBlock } from "@/components/intelligence/ProgressAnalyticsBlock";
import { savePracticeResult, getLastPracticeResultForRoutine } from "@/lib/practiceResults";
import { demoPracticeResults } from "@/lib/demoPracticeResults";
import { saveTestResult, getLastTestResult } from "@/lib/testResults";
import {
  computeTestFinalScore,
  computeTimeEfficiency,
  getTestPerformanceTier,
  getTierLabel,
  type PerformanceTier,
} from "@/utils/scoring";
import type { PracticeMetrics } from "@/hooks/usePracticeMetrics";

interface Flashcard {
  id: string;
  step_number: number;
  title: string;
  description: string;
  routine_id: string;
  icon?: string;
  image_url?: string;
  video_url?: string | null;
}

interface Routine {
  id: string;
  title: string;
  icon: string;
  video_url: string | null;
  flashcards: Flashcard[];
}

export default function Child() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showTestSummary, setShowTestSummary] = useState(false);
  const [lastPracticeMetrics, setLastPracticeMetrics] = useState<PracticeMetrics | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{
    finalScore: number;
    tier: PerformanceTier;
    metrics: PracticeMetrics;
  } | null>(null);
  const [historicalTestScore, setHistoricalTestScore] = useState<number | undefined>(undefined);
  const [lastEngagementForRoutine, setLastEngagementForRoutine] = useState<number | null>(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const demoMode = (String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true') || !isSupabaseConfigured;
  const useDemoStore = demoMode || !user;

  const fetchScheduledRoutines = useCallback(async () => {
    try {
      if (useDemoStore) {
        const list = demoStore.getAllScheduledRoutines().length > 0
          ? demoStore.getAllScheduledRoutines()
          : demoStore.getAllRoutinesWithFlashcards();
        const items = list.map(r => ({
          id: r.id,
          title: r.title,
          icon: r.icon,
          video_url: r.video_url ?? null,
          flashcards: r.flashcards.map(f => ({
            id: f.id,
            step_number: f.step_number,
            title: f.title,
            description: f.description,
            routine_id: f.routine_id,
            icon: f.icon,
            image_url: f.image_url ?? undefined,
            video_url: f.video_url ?? null,
          })),
        }));
        setRoutines(items);
      } else {
        const { data: schedules, error: schedulesError } = await supabase
          .from("routine_schedules")
          .select(`
            *,
            routines(
              *,
              flashcards(*)
            )
          `)
          .eq("is_active", true);

        if (schedulesError) throw schedulesError;

        const relevantRoutines = schedules
          ?.map((s) => s.routines as unknown as Routine)
          .filter((r) => r && r.flashcards?.length > 0) || [];

        setRoutines(relevantRoutines);
      }
    } catch (error: unknown) {
      const message = (error as Error)?.message || "Failed to load routines";
      toast.error(message);
      console.error("Error loading scheduled routines:", error);
    } finally {
      setIsLoading(false);
    }
  }, [useDemoStore]);

  useEffect(() => {
    fetchScheduledRoutines();
  }, [fetchScheduledRoutines]);

  const currentRoutine = routines[currentRoutineIndex];
  const currentCard = currentRoutine?.flashcards?.[currentStep];
  const currentRoutineId = routines[currentRoutineIndex]?.id;

  useEffect(() => {
    if (!currentRoutineId) {
      setLastEngagementForRoutine(null);
      return;
    }
    if (useDemoStore) {
      const last = demoPracticeResults.getLastForRoutine(currentRoutineId);
      setLastEngagementForRoutine(last?.engagement_score ?? null);
    } else if (user?.id) {
      getLastPracticeResultForRoutine(user.id, currentRoutineId).then((r) => {
        setLastEngagementForRoutine(r?.engagement_score ?? null);
      });
    } else {
      setLastEngagementForRoutine(null);
    }
  }, [currentRoutineId, useDemoStore, user?.id]);

  useEffect(() => {
    if (!currentCard?.title) {
      setHistoricalTestScore(undefined);
      return;
    }
    if (useDemoStore) {
      // For demo, we can just use a random score or look at local storage
      const raw = localStorage.getItem("rb_demo_test_results");
      const list = raw ? JSON.parse(raw) : [];
      const match = list.find((r: any) => r.activity_type === currentCard.title);
      setHistoricalTestScore(match?.final_score);
    } else if (user?.id) {
      getLastTestResult(user.id, currentCard.title).then((r) => {
        setHistoricalTestScore(r?.final_score);
      });
    }
  }, [currentCard?.title, useDemoStore, user?.id]);

  const handlePracticeComplete = async (metrics: PracticeMetrics) => {
    setLastPracticeMetrics(metrics);
    setShowPracticeModal(false);
    setShowSessionSummary(true);
    if (useDemoStore) {
      demoPracticeResults.add(
        metrics.engagementScore,
        metrics.motionScore,
        metrics.responseTimeSec,
        metrics.totalTimeSec
      );
      setLastEngagementForRoutine(Math.round((metrics.engagementScore + metrics.motionScore) / 2));
    } else if (user?.id && currentRoutineId && currentCard) {
      const res = await savePracticeResult({
        userId: user.id,
        activityType: currentCard.title,
        flashcardId: currentCard.id,
        routineId: currentRoutineId,
        metrics,
      });
      if ("error" in res) toast.error(res.error);
      else setLastEngagementForRoutine(Math.round((metrics.engagementScore + metrics.motionScore) / 2));
    }
  };

  const handleTestComplete = async (metrics: PracticeMetrics) => {
    const timeEfficiency = computeTimeEfficiency(metrics.totalTimeSec, 15, 120);
    const finalScore = computeTestFinalScore(
      metrics.engagementScore,
      metrics.motionScore,
      timeEfficiency
    );
    const tier = getTestPerformanceTier(finalScore);

    setLastTestResult({ finalScore, tier, metrics });
    setShowTestModal(false);
    setShowTestSummary(true);

    if (!demoMode && user?.id && currentCard) {
      const res = await saveTestResult({
        userId: user.id,
        activityType: currentCard.title,
        engagement: metrics.engagementScore,
        motionAccuracy: metrics.motionScore,
        timeEfficiency,
        finalScore,
        performanceTier: tier,
        totalTimeSec: metrics.totalTimeSec,
      });
      if ("error" in res) toast.error(res.error);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const handlePlayVideo = (url?: string | null) => {
    const videoUrl = url || routines[currentRoutineIndex]?.video_url;

    if (videoUrl) {
      setActiveVideoUrl(videoUrl);
      setShowVideoDialog(true);
    } else {
      toast.info("No video available");
    }
  };

  const handleUseRecording = async () => {
    const routine = routines[currentRoutineIndex];
    const card = routine?.flashcards?.[currentStep];
    if (!card) return;
    setLoadingRecording(true);
    try {
      const prompt = `${card.title}. ${card.description}`;
      const res = await requestGenerateAnimation(prompt);
      const url = res.video_path;
      if (!url) {
        toast.error("No video found for this step");
        return;
      }
      if (useDemoStore) {
        demoStore.setFlashcardVideoUrl(card.id, url);
      } else {
        await supabase.from("flashcards").update({ video_url: url }).eq("id", card.id);
      }
      const updatedRoutines = [...routines];
      const rIdx = currentRoutineIndex;
      const cIdx = updatedRoutines[rIdx].flashcards.findIndex(f => f.id === card.id);
      if (cIdx !== -1) updatedRoutines[rIdx].flashcards[cIdx] = { ...card, video_url: url };
      setRoutines(updatedRoutines);
      toast.success("AI video attached!");
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? "Could not generate video");
    } finally {
      setLoadingRecording(false);
    }
  };

  const { points, stars, streak, addPoints, completeRoutine } = useRewards();

  const handleNextStep = () => {
    const currentRoutine = routines[currentRoutineIndex];
    addPoints(5); // Task completion reward

    if (currentStep < (currentRoutine?.flashcards?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeRoutine(); // Routine completion reward (points + star)
      if (currentRoutineIndex < routines.length - 1) {
        setCurrentRoutineIndex(currentRoutineIndex + 1);
        setCurrentStep(0);
      } else {
        toast.success("All routines for today completed! Great job!", {
          icon: "🌟",
        });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentRoutineIndex > 0) {
      setCurrentRoutineIndex(currentRoutineIndex - 1);
      const prevRoutine = routines[currentRoutineIndex - 1];
      setCurrentStep((prevRoutine?.flashcards?.length || 1) - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-hero)]">
        <div className="flex flex-col items-center gap-4 animate-bounce-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          <p className="text-lg font-medium text-muted-foreground">{t('child.loading')}</p>
        </div>
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
          <Navigation />
          <main className="pt-24 pb-12 px-4 flex items-center justify-center min-h-[calc(100vh-96px)]">
            <Card className="max-w-md animate-bounce-in">
              <CardContent className="py-12 text-center space-y-4">
                <div className="text-6xl mb-4 animate-wiggle">📅</div>
                <h2 className="text-2xl font-bold">{t('child.noRoutines')}</h2>
                <p className="text-muted-foreground">
                  {t('child.noRoutinesDesc')}
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No flashcard available</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#E0F7F7] font-inter pb-12">
        <Navigation />

        <main className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-lg">
            {/* Reward HUD & Shop */}
            <div className="flex justify-between items-center mb-6 px-2">
              <Link to="/shop">
                <Button variant="outline" className="rounded-2xl gap-2 font-fredoka border-2 border-primary/20 text-primary hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95">
                  <ShoppingBag className="w-5 h-5" />
                  Shop
                </Button>
              </Link>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-sm">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-fredoka text-slate-700">{points}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-sm">
                  <Star className="w-5 h-5 text-secondary" />
                  <span className="font-fredoka text-slate-700">{stars}</span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-sm animate-pulse-slow">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-fredoka text-slate-700">{streak}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image 2 style "EXERCISES" header */}
            <div className="text-center mb-6 animate-fade-in-down">
              <h1 className="text-2xl font-fredoka text-slate-800 uppercase tracking-widest mb-4">
                Exercises
              </h1>

              {/* Year / Month / Today Tabs */}
              <div className="flex bg-white/50 p-1 rounded-2xl mx-auto w-fit mb-8 shadow-sm">
                <button className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500">Year</button>
                <button className="px-6 py-2 rounded-xl text-sm font-bold bg-secondary text-white shadow-sm">Today</button>
                <button className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500">Month</button>
              </div>

              <AvatarCustomizer className="mb-6 scale-125" />
            </div>

            {/* Feature 2: Visual Routine Tracker */}
            <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 mb-8 border border-white shadow-sm transition-all hover:shadow-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-fredoka text-slate-700">Routine Progress</h3>
                <span className="text-sm font-fredoka text-slate-500">{Math.round(((currentStep + 1) / (currentRoutine.flashcards?.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${((currentStep + 1) / (currentRoutine.flashcards?.length || 1)) * 100}%` }}
                />
              </div>
              <div className="space-y-2">
                {currentRoutine.flashcards?.map((step, idx) => (
                  <div key={step.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${idx <= currentStep ? 'bg-primary/5 border-primary/20 border' : 'bg-slate-50/50 border-transparent border'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${idx < currentStep ? 'bg-green-500 text-white' : idx === currentStep ? 'bg-primary text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                      {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`font-medium truncate ${idx < currentStep ? 'text-slate-400 line-through' : idx === currentStep ? 'text-slate-900 border-b-2 border-primary/30' : 'text-slate-500'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Detail (Image 2 style cards) */}
            <div className="space-y-4 mb-8">
              <RoutineIntelligenceIndicator cameraActive={false} className="mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border-b-4 border-orange-100 animate-slide-in-up">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-fredoka text-slate-800 truncate">{currentRoutine.title}</p>
                    <IntelligenceBadge className="shrink-0" />
                  </div>
                  <p className="text-3xl font-fredoka text-orange-500">
                    {Math.round(((currentStep + 1) / (currentRoutine.flashcards?.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border-b-4 border-primary/10 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                  <p className="font-fredoka text-slate-800 mb-1">Total Steps</p>
                  <p className="text-3xl font-fredoka text-primary">
                    {currentStep + 1}/{currentRoutine.flashcards?.length}
                  </p>
                </div>
              </div>

              {/* Main Instruction Card */}
              <Card className="rounded-[2.5rem] border-none shadow-vibrant overflow-hidden animate-scale-in">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="text-7xl animate-float-slow mb-4">
                    {currentCard.icon || "✨"}
                  </div>
                  <h2 className="text-3xl font-fredoka text-slate-900 leading-tight">
                    {currentCard.title}
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {currentCard.description}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-4 justify-center">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => speak(`${currentCard.title}. ${currentCard.description}`)}
                      className="flex-1 min-w-[7rem] rounded-2xl h-14 font-fredoka text-lg shadow-cartoon"
                    >
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0" />
                      Read
                    </Button>

                    {currentCard.video_url ? (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handlePlayVideo(currentCard.video_url)}
                        className="flex-1 min-w-[7rem] rounded-2xl h-14 font-fredoka text-lg shadow-cartoon border-2 border-accent text-accent"
                      >
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0" />
                        View
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="outline"
                        disabled={loadingRecording}
                        onClick={handleUseRecording}
                        className="flex-1 min-w-[7rem] rounded-2xl h-14 font-fredoka text-lg shadow-cartoon border-2 border-primary/30 text-primary"
                      >
                        <Film className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0 ${loadingRecording ? "animate-spin" : ""}`} />
                        {loadingRecording ? "Generating..." : "Generate AI video"}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setShowPracticeModal(true)}
                      className="flex-1 min-w-[7rem] rounded-2xl h-14 font-fredoka text-lg shadow-cartoon"
                    >
                      <Video className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0" />
                      Practice
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setShowTestModal(true)}
                      className="flex-1 min-w-[7rem] rounded-2xl h-14 font-fredoka text-lg shadow-cartoon"
                    >
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0" />
                      Test
                    </Button>
                  </div>
                  <AITipSnippet />
                  <FlashcardIntelligenceSnippet
                    stepIndex={currentStep}
                    totalSteps={currentRoutine.flashcards?.length ?? 0}
                    testScore={historicalTestScore}
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Steps Progress (Image 2 bottom tracker) */}
            <div className="bg-white/50 p-6 rounded-[2.5rem] shadow-inner mb-8">
              <div className="flex justify-between items-center mb-3">
                <p className="font-fredoka text-slate-800">Total Tasks</p>
                <p className="font-fredoka text-primary">
                  {Math.round(((currentStep + 1) / (currentRoutine.flashcards?.length || 1)) * 100)}%
                </p>
              </div>
              <EngagementSnippet lastEngagementScore={lastEngagementForRoutine} className="mb-2" />
              <div className="w-full h-4 bg-white rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div
                  className="h-full bg-primary transition-all duration-700 rounded-full"
                  style={{ width: `${((currentStep + 1) / (currentRoutine.flashcards?.length || 1)) * 100}%` }}
                />
              </div>
              <ProgressAnalyticsBlock
                currentStep={currentStep}
                totalSteps={currentRoutine.flashcards?.length ?? 0}
                lastEngagementScore={lastEngagementForRoutine}
                className="mt-4"
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePrevStep}
                disabled={currentRoutineIndex === 0 && currentStep === 0}
                className="flex-1 rounded-2xl h-14 font-fredoka bg-white/40 border-2 border-white/60"
              >
                <ChevronLeft className="w-6 h-6 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleNextStep}
                disabled={
                  currentRoutineIndex === routines.length - 1 &&
                  currentStep === (currentRoutine.flashcards?.length || 0) - 1
                }
                className="flex-1 rounded-2xl h-14 font-fredoka shadow-vibrant"
              >
                Next
                <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Practice modal with webcam */}
      {showPracticeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
            <h3 className="text-lg font-fredoka mb-4">Practice: {currentCard?.title}</h3>
            <WebcamComponent
              activityLabel="Practice"
              onPracticeComplete={handlePracticeComplete}
              onSkip={() => setShowPracticeModal(false)}
            />
          </div>
        </div>
      )}

      {/* Test modal with webcam */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
            <h3 className="text-lg font-fredoka mb-4">Test: {currentCard?.title}</h3>
            <WebcamComponent
              activityLabel="Test"
              onPracticeComplete={handleTestComplete}
              onSkip={() => setShowTestModal(false)}
            />
          </div>
        </div>
      )}

      {/* Session summary after practice */}
      {showSessionSummary && lastPracticeMetrics && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="w-full max-w-sm">
            <SessionSummaryCard
              metrics={lastPracticeMetrics}
              onContinue={() => {
                setShowSessionSummary(false);
                setLastPracticeMetrics(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Test summary after test */}
      {showTestSummary && lastTestResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="w-full max-w-sm">
            <Card className="rounded-[2rem] border-2 border-primary/20 overflow-hidden shadow-vibrant">
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <Award className="w-16 h-16 mx-auto text-primary mb-4" />
                  <h2 className="text-2xl font-fredoka text-slate-900">
                    Test complete
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Final score</p>
                    <p className="text-3xl font-fredoka text-primary">
                      {lastTestResult.finalScore}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="text-xl font-fredoka">
                      {getTierLabel(lastTestResult.tier)}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full rounded-2xl font-fredoka"
                  onClick={() => {
                    setShowTestSummary(false);
                    setLastTestResult(null);
                  }}
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Inline dialog for video playback */}
      {showVideoDialog && activeVideoUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-background rounded-xl shadow-2xl w-[90vw] max-w-[900px] p-4 relative animate-scale-in border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Watching Video
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowVideoDialog(false);
                  setActiveVideoUrl(null);
                }}
                className="hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                <div className="h-6 w-6">✕</div>
              </Button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
              <video
                src={activeVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
