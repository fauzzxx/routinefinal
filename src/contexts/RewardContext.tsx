import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/storage';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

interface RewardContextType {
    points: number;
    stars: number;
    streak: number;
    badges: Badge[];
    lastActiveDate: string | null;
    addPoints: (amount: number) => void;
    addStar: () => void;
    completeRoutine: () => void;
    unlockedBadges: string[];
}

const BADGES: Badge[] = [
    { id: 'first_step', name: 'First Step', description: 'Complete your first task', icon: '🌱' },
    { id: 'routine_master', name: 'Routine Master', description: 'Complete 5 routines', icon: '🏆' },
    { id: 'streak_3', name: '3-Day Warrior', description: 'Maintain a 3-day streak', icon: '🔥' },
    { id: 'streak_7', name: '7-Day Legend', description: 'Maintain a 7-day streak', icon: '👑' },
    { id: 'star_collector', name: 'Star Collector', description: 'Earn 10 stars', icon: '⭐' },
];

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export const RewardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [points, setPoints] = useState<number>(() => storage.get('points', 0));
    const [stars, setStars] = useState<number>(() => storage.get('stars', 0));
    const [streak, setStreak] = useState<number>(() => storage.get('streak', 0));
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => storage.get('unlockedBadges', []));
    const [lastActiveDate, setLastActiveDate] = useState<string | null>(() => storage.get('lastActiveDate', null));

    // Sync with localStorage
    useEffect(() => {
        storage.set('points', points);
        storage.set('stars', stars);
        storage.set('streak', streak);
        storage.set('unlockedBadges', unlockedBadges);
        storage.set('lastActiveDate', lastActiveDate);
    }, [points, stars, streak, unlockedBadges, lastActiveDate]);

    // Streak logic
    useEffect(() => {
        const checkStreak = () => {
            const today = new Date().toISOString().split('T')[0];
            if (!lastActiveDate) return;

            const lastDate = new Date(lastActiveDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                setStreak(0); // Reset streak if more than 1 day missed
            }
        };
        checkStreak();
    }, [lastActiveDate]);

    const unlockBadge = useCallback((badgeId: string) => {
        if (!unlockedBadges.includes(badgeId)) {
            setUnlockedBadges(prev => [...prev, badgeId]);
            // You could trigger a toast or animation here
        }
    }, [unlockedBadges]);

    const addPoints = useCallback((amount: number) => {
        setPoints(prev => prev + amount);
        const today = new Date().toISOString().split('T')[0];

        // Update streak if it's a new day
        if (lastActiveDate !== today) {
            if (lastActiveDate) {
                const lastDate = new Date(lastActiveDate);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    setStreak(s => s + 1);
                } else if (diffDays > 1) {
                    setStreak(1);
                }
            } else {
                setStreak(1);
            }
            setLastActiveDate(today);
        }

        // Check for badges
        if (unlockedBadges.length === 0) unlockBadge('first_step');
    }, [lastActiveDate, unlockedBadges, unlockBadge]);

    const addStar = useCallback(() => {
        setStars(prev => prev + 1);
        if (stars + 1 >= 10) unlockBadge('star_collector');
    }, [stars, unlockBadge]);

    const completeRoutine = useCallback(() => {
        addPoints(10); // +10 bonus
        addStar();
        // Logic for routine master badge could be added here (e.g. tracking routine count)
    }, [addPoints, addStar]);

    // Check streak badges
    useEffect(() => {
        if (streak >= 3) unlockBadge('streak_3');
        if (streak >= 7) unlockBadge('streak_7');
    }, [streak, unlockBadge]);

    return (
        <RewardContext.Provider value={{
            points,
            stars,
            streak,
            badges: BADGES,
            lastActiveDate,
            addPoints,
            addStar,
            completeRoutine,
            unlockedBadges
        }}>
            {children}
        </RewardContext.Provider>
    );
};

export const useRewards = () => {
    const context = useContext(RewardContext);
    if (!context) {
        throw new Error('useRewards must be used within RewardProvider');
    }
    return context;
};
