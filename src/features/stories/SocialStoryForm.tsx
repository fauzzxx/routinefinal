import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { getEmojiForText } from '@/utils/emojiMapper';

export interface StoryStep {
    step: number;
    title: string;
    text: string;
    emotionSupport: string;
    emoji: string;
}

interface SocialStoryFormProps {
    onGenerate: (story: StoryStep[]) => void;
}

export const SocialStoryForm: React.FC<SocialStoryFormProps> = ({ onGenerate }) => {
    const [topic, setTopic] = useState('');
    const [age, setAge] = useState('5');
    const [loading, setLoading] = useState(false);

    const generateStory = async () => {
        setLoading(true);
        // Simulate AI Generation
        setTimeout(() => {
            const mockStory: StoryStep[] = [
                {
                    step: 1,
                    title: `Getting Ready for ${topic}`,
                    text: `Today we are going to learn about ${topic}. It's going to be a new adventure!`,
                    emotionSupport: 'It is okay to feel curious about new things.',
                    emoji: getEmojiForText(topic)
                },
                {
                    step: 2,
                    title: 'Taking Small Steps',
                    text: `First, we will get everything we need. We can do this together.`,
                    emotionSupport: 'You are doing a great job being patient.',
                    emoji: '🤝'
                },
                {
                    step: 3,
                    title: 'Stay Calm and Breathe',
                    text: `When we arrive, we will take a deep breath. The environment might be different, but we are safe.`,
                    emotionSupport: 'If you feel overwhelmed, it is okay to take a break.',
                    emoji: '🧘'
                },
                {
                    step: 4,
                    title: 'Learning and Doing',
                    text: `Now it is time for ${topic}. We focus on one thing at a time. Special people are there to help.`,
                    emotionSupport: 'You are brave and strong.',
                    emoji: '🦁'
                },
                {
                    step: 5,
                    title: 'All Done!',
                    text: `We finished! We can feel happy because we tried something new today.`,
                    emotionSupport: `I am so proud of how you handled ${topic}!`,
                    emoji: '🎖️'
                }
            ];
            onGenerate(mockStory);
            setLoading(false);
        }, 1500);
    };

    return (
        <Card className="rounded-[2rem] border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="font-fredoka text-2xl flex items-center gap-2">
                    <BookOpen className="text-secondary" />
                    Create Social Story
                </CardTitle>
                <CardDescription>
                    Generate a custom 5-step story for any situation.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="topic">What's the topic?</Label>
                    <Input
                        id="topic"
                        placeholder="e.g., Going to the Dentist, First Day of School"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="rounded-xl border-white bg-white/50 focus:bg-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="age">Child's Age</Label>
                    <Select value={age} onValueChange={setAge}>
                        <SelectTrigger id="age" className="rounded-xl border-white bg-white/50">
                            <SelectValue placeholder="Select age" />
                        </SelectTrigger>
                        <SelectContent>
                            {[3, 4, 5, 6, 7, 8, 9, 10].map(a => (
                                <SelectItem key={a} value={a.toString()}>{a} years old</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={generateStory}
                    disabled={!topic || loading}
                    className="w-full rounded-xl h-12 font-fredoka shadow-vibrant gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    Generate Story
                </Button>
            </CardContent>
        </Card>
    );
};
