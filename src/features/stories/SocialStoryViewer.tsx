import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Volume2, X, RefreshCw } from 'lucide-react';
import { StoryStep } from './SocialStoryForm';
import { speak, stopSpeaking } from '@/utils/speech';

interface SocialStoryViewerProps {
    story: StoryStep[];
    onClose: () => void;
    onRegenerate: () => void;
}

export const SocialStoryViewer: React.FC<SocialStoryViewerProps> = ({ story, onClose, onRegenerate }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [autoplay, setAutoplay] = useState(true);

    const step = story[currentStep];

    useEffect(() => {
        if (autoplay && step) {
            speak(`${step.title}. ${step.text}. ${step.emotionSupport}`);
        }
        return () => stopSpeaking();
    }, [currentStep, autoplay, step]);

    const nextStep = () => {
        if (currentStep < story.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#FDFCF0]/95 z-[100] flex flex-col p-4 animate-fade-in overflow-auto">
            <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto w-full">
                <Button variant="ghost" onClick={onClose} className="rounded-2xl h-12 w-12 p-0 text-slate-400">
                    <X className="w-6 h-6" />
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onRegenerate} className="rounded-xl font-fredoka border-primary/20 text-primary">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                    </Button>
                    <Button
                        variant={autoplay ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setAutoplay(!autoplay)}
                        className="rounded-xl font-fredoka"
                    >
                        <Volume2 className={`w-4 h-4 mr-2 ${autoplay ? 'animate-pulse' : ''}`} />
                        {autoplay ? 'Voice ON' : 'Voice OFF'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full mb-8">
                {step && (
                    <Card className="rounded-[4rem] border-none shadow-vibrant bg-white overflow-hidden w-full max-w-md animate-scale-in aspect-[4/5] flex flex-col">
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8">
                            <div className="text-9xl animate-float-slow py-4 drop-shadow-lg">
                                {step.emoji}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-fredoka text-slate-800 leading-tight">
                                    {step.title}
                                </h2>
                                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                                    {step.text}
                                </p>
                            </div>

                            <div className="bg-primary/10 p-6 rounded-[2.5rem] border border-primary/20 w-full animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                                <p className="text-primary font-fredoka text-lg italic">
                                    "{step.emotionSupport}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="max-w-md mx-auto w-full flex gap-4 pb-8">
                <Button
                    variant="outline"
                    disabled={currentStep === 0}
                    onClick={prevStep}
                    className="flex-1 rounded-[2rem] h-16 font-fredoka text-xl border-slate-200 shadow-sm"
                >
                    <ChevronLeft className="w-6 h-6 mr-2" />
                    Previous
                </Button>
                <Button
                    disabled={currentStep === story.length - 1}
                    onClick={nextStep}
                    className="flex-1 rounded-[2rem] h-16 font-fredoka text-xl shadow-vibrant"
                >
                    Next
                    <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
            </div>

            <div className="flex justify-center gap-2 mb-4">
                {story.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`}
                    />
                ))}
            </div>
        </div>
    );
};
