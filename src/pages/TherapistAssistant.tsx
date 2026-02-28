import React, { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/utils/storage';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Lightbulb, FileText, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TherapistAssistant() {
    const navigate = useNavigate();

    const insights = useMemo(() => {
        // In a real app, this would analyze localStorage logs
        // Mocking therapeutic insights
        return [
            {
                id: '1',
                type: 'recommendation',
                title: 'Adjust Routine Length',
                description: 'Engagement drops after the 4th step. Consider breaking the "Morning Routine" into two smaller micro-routines.',
                icon: <Lightbulb className="text-yellow-500" />,
                color: 'bg-yellow-50 border-yellow-100'
            },
            {
                id: '2',
                type: 'success',
                title: 'Strong Visual Preference',
                description: 'Child interacts 40% more with video-based instructions. Increase the use of AI-generated videos.',
                icon: <CheckCircle2 className="text-green-500" />,
                color: 'bg-green-50 border-green-100'
            },
            {
                id: '3',
                type: 'warning',
                title: 'Difficulty with "Brushing Teeth"',
                description: 'Response time is consistently high for this task. Suggest using a Social Story to reduce anxiety.',
                icon: <AlertTriangle className="text-orange-500" />,
                color: 'bg-orange-50 border-orange-100'
            }
        ];
    }, []);

    const downloadReport = () => {
        const reportData = {
            title: "Weekly Behavioral Progress Report",
            date: new Date().toLocaleDateString(),
            insights: insights.map(i => `${i.title}: ${i.description}`),
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Report downloaded successfully!");
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 font-inter pb-20">
                <Navigation />

                <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/caregiver')} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-fredoka text-slate-900">Therapist Assistant</h1>
                            <p className="text-slate-500">AI-driven behavioral insights & reports</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[2rem] border-none shadow-md bg-white overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <CardTitle className="font-fredoka text-2xl flex items-center gap-2">
                                            <Stethoscope className="text-primary" />
                                            Weekly AI Analysis
                                        </CardTitle>
                                        <CardDescription>Generated based on last 7 days of activity</CardDescription>
                                    </div>
                                    <Button onClick={downloadReport} variant="outline" className="rounded-xl border-primary/20 text-primary gap-2">
                                        <Download className="w-4 h-4" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {insights.map((insight) => (
                                    <div key={insight.id} className={`${insight.color} p-6 rounded-2xl border-2 flex gap-4 transition-transform hover:scale-[1.01]`}>
                                        <div className="shrink-0">{insight.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 mb-1">{insight.title}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4">
                                    <Button className="w-full rounded-2xl h-14 font-fredoka shadow-vibrant gap-2">
                                        <FileText className="w-5 h-5" />
                                        Generate Full Summary Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <section className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-fredoka mb-2">Need advice?</h3>
                                <p className="opacity-80 text-sm mb-6 max-w-[80%]">Submit a specific question to our AI assistant for therapeutic recommendations.</p>
                                <Button variant="outline" className="bg-white text-indigo-600 border-none rounded-xl font-bold">
                                    Ask Assistant
                                </Button>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 bg-white rounded-full" />
                        </section>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
