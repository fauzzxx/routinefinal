import React from 'react';
import { storage } from '@/utils/storage';

interface AvatarCustomizerProps {
    className?: string;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ className }) => {
    const unlockedItems = storage.get<string[]>('unlockedShopItems', []);

    const hasSunglasses = unlockedItems.includes('sunglasses');
    const hasCap = unlockedItems.includes('cap');
    const hasCape = unlockedItems.includes('cape');
    const hasCrown = unlockedItems.includes('crown');

    return (
        <div className={`relative w-32 h-32 mx-auto ${className}`}>
            {/* Character Body - A cute colorful blob */}
            <div className="absolute inset-4 bg-primary rounded-[2.5rem] shadow-lg animate-bounce-slow flex items-center justify-center">
                {/* Face */}
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Eyes */}
                    <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-white rounded-full" />
                    <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full" />

                    {/* Mouth */}
                    <div className="absolute bottom-1/3 w-8 h-4 border-b-4 border-white rounded-full" />

                    {/* ACCESSORIES */}
                    {hasSunglasses && (
                        <div className="absolute top-[28%] w-full h-8 flex justify-center gap-1 z-20 animate-fade-in">
                            <div className="w-10 h-6 bg-slate-900 rounded-lg shadow-md" />
                            <div className="w-10 h-6 bg-slate-900 rounded-lg shadow-md" />
                            <div className="absolute top-2 w-16 h-1 bg-slate-900 rounded-full" />
                        </div>
                    )}
                </div>
            </div>

            {hasCap && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 bg-red-500 rounded-t-full z-10 animate-slide-in-up">
                    <div className="absolute bottom-0 right-[-10px] w-12 h-2 bg-red-600 rounded-full" />
                </div>
            )}

            {hasCrown && (
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-4xl z-30 animate-bounce-slow">
                    👑
                </div>
            )}

            {hasCape && (
                <div className="absolute inset-0 bg-indigo-500/30 rounded-[3rem] -z-10 animate-pulse scale-110" />
            )}
        </div>
    );
};
