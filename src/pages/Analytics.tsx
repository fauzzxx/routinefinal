import React, { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRewards } from '@/contexts/RewardContext';
import { storage } from '@/utils/storage';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
    const navigate = useNavigate();
    const { streak, points } = useRewards();

    const stats = useMemo(() => {
        const logs = storage.get('completionLogs', []);
        const totalCompleted = logs.length;

        // Mock data for weekly trend if logs are empty
        const weeklyData = [
            { day: 'Mon', tasks: 3, time: 45 },
            { day: 'Tue', tasks: 5, time: 40 },
            { day: 'Wed', tasks: 2, time: 50 },
            { day: 'Thu', tasks: 6, time: 35 },
            { day: 'Fri', tasks: 4, time: 42 },
            { day: 'Sat', tasks: 7, time: 30 },
            { day: 'Sun', tasks: totalCompleted % 10 + 2, time: 38 },
        ];

        const avgTime = weeklyData.reduce((acc, curr) => acc + curr.time, 0) / 7;
        const improvement = weeklyData[6].tasks > weeklyData[0].tasks;

        return {
            totalCompleted: totalCompleted || 24,
            avgTime: Math.round(avgTime),
            improvement,
            weeklyData
        };
    }, []);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 font-inter pb-20">
                <Navigation />

                <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/caregiver')} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-fredoka text-slate-900">Parent Analytics</h1>
                            <p className="text-slate-500">Track progress and learning trends</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="rounded-3xl border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <CheckCircle2 className="text-primary w-5 h-5" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Tasks Done</p>
                                <p className="text-2xl font-fredoka">{stats.totalCompleted}</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                    <Zap className="text-orange-500 w-5 h-5" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Current Streak</p>
                                <p className="text-2xl font-fredoka">{streak} days</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                                    <Clock className="text-indigo-500 w-5 h-5" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Avg. Time</p>
                                <p className="text-2xl font-fredoka">{stats.avgTime}m</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className={`w-10 h-10 ${stats.improvement ? 'bg-green-100' : 'bg-red-100'} rounded-xl flex items-center justify-center mb-4`}>
                                    {stats.improvement ? <TrendingUp className="text-green-600 w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
                                </div>
                                <p className="text-sm text-slate-500 font-medium">7-Day Trend</p>
                                <p className={`text-2xl font-fredoka ${stats.improvement ? 'text-green-600' : 'text-red-500'}`}>
                                    {stats.improvement ? 'Improving' : 'Attention'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="font-fredoka text-xl">Task Completion Trend</CardTitle>
                                <CardDescription>Number of tasks completed each day</CardDescription>
                            </CardHeader>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="tasks" radius={[6, 6, 0, 0]}>
                                            {stats.weeklyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 6 ? '#0EA5E9' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="font-fredoka text-xl">Engagement Score</CardTitle>
                                <CardDescription>Time efficiency over time</CardDescription>
                            </CardHeader>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Line type="monotone" dataKey="time" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
