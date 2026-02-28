import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SocialStoryForm, StoryStep } from '@/features/stories/SocialStoryForm';
import { SocialStoryViewer } from '@/features/stories/SocialStoryViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/utils/storage';

export default function SocialStories() {
    const navigate = useNavigate();
    const [currentStory, setCurrentStory] = useState<StoryStep[] | null>(null);
    const [history, setHistory] = useState<StoryStep[][]>(() => storage.get('storyHistory', []));

    const handleGenerate = (story: StoryStep[]) => {
        setCurrentStory(story);
        // Add to history (limit to 5)
        const newHistory = [story, ...history.slice(0, 4)];
        setHistory(newHistory);
        storage.set('storyHistory', newHistory);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#FDFCF0] font-inter pb-20">
                <Navigation />

                <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/caregiver')} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-3xl font-fredoka text-slate-900">Social Stories</h1>
                    </div>

                    <div className="space-y-8">
                        <SocialStoryForm onGenerate={handleGenerate} />

                        {history.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-500 font-fredoka mb-2">
                                    <History className="w-4 h-4" />
                                    <h3>Recent Stories</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {history.map((story, i) => (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            onClick={() => setCurrentStory(story)}
                                            className="h-auto p-4 rounded-2xl justify-start border-none bg-white shadow-sm hover:shadow-md transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
                                                {story[0]?.emoji || '📖'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-fredoka text-slate-800 truncate">{story[0]?.title.replace('Getting Ready for ', '')}</p>
                                                <p className="text-xs text-slate-400">5 steps • Today</p>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </main>

                {currentStory && (
                    <SocialStoryViewer
                        story={currentStory}
                        onClose={() => setCurrentStory(null)}
                        onRegenerate={() => {
                            const topic = currentStory[0]?.title.replace('Getting Ready for ', '');
                            setCurrentStory(null);
                            // In a real app, this would re-trigger generation
                            // Here we just clear it so they can type again or we could automock it
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
