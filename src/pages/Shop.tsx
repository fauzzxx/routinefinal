import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRewards } from '@/contexts/RewardContext';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, CheckCircle2, Coins, Sparkles } from 'lucide-react';
import { storage } from '@/utils/storage';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    icon: string;
    description: string;
    category: 'accessory' | 'effect' | 'mini-game';
}

const SHOP_ITEMS: ShopItem[] = [
    { id: 'sunglasses', name: 'Cool Sunglasses', price: 50, icon: '😎', description: 'Make your avatar look super cool!', category: 'accessory' },
    { id: 'cap', name: 'Sporty Cap', price: 30, icon: '🧢', description: 'A stylish cap for any routine.', category: 'accessory' },
    { id: 'cape', name: 'Starry Cape', price: 100, icon: '🦸', description: 'Look like a superhero during learning!', category: 'accessory' },
    { id: 'crown', name: 'Golden Crown', price: 150, icon: '👑', description: 'For true routine royalty.', category: 'accessory' },
    { id: 'sparkles', name: 'Magic Sparkles', price: 75, icon: '✨', description: 'Add magic effects to completion!', category: 'effect' },
    { id: 'party', name: 'Party Popper', price: 40, icon: '🎉', description: 'Celebrate every step with a bang!', category: 'effect' },
];

export default function Shop() {
    const navigate = useNavigate();
    const { points, addPoints } = useRewards(); // We can use addPoints with negative value for purchase
    const [unlockedItems, setUnlockedItems] = useState<string[]>(() => storage.get('unlockedShopItems', []));

    const buyItem = (item: ShopItem) => {
        if (unlockedItems.includes(item.id)) {
            toast.info("You already own this item!");
            return;
        }
        if (points < item.price) {
            toast.error(`You need ${item.price - points} more points!`);
            return;
        }

        addPoints(-item.price);
        const newUnlocked = [...unlockedItems, item.id];
        setUnlockedItems(newUnlocked);
        storage.set('unlockedShopItems', newUnlocked);
        toast.success(`Purchased ${item.name}!`, {
            icon: <Sparkles className="w-4 h-4 text-yellow-500" />
        });
    };

    return (
        <div className="min-h-screen bg-[#FDFCF0] font-inter pb-12">
            <Navigation />

            <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/child')}
                        className="rounded-xl gap-2 font-fredoka text-slate-600 hover:bg-white/40"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Learning
                    </Button>
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 shadow-sm animate-bounce-slow">
                        <Coins className="w-5 h-5 text-primary" />
                        <span className="font-fredoka text-lg text-primary">{points} pts</span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <AvatarCustomizer className="mb-4" />
                    <h1 className="text-3xl font-fredoka text-slate-900 mb-2">Reward Shop</h1>
                    <p className="text-slate-500">Spend your hard-earned points on cool stuff!</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {SHOP_ITEMS.map((item) => {
                        const isUnlocked = unlockedItems.includes(item.id);
                        return (
                            <Card key={item.id} className={`rounded-[2rem] border-none shadow-sm transition-all duration-300 hover:scale-[1.02] ${isUnlocked ? 'bg-white/40 opacity-80' : 'bg-white'}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl border border-slate-100">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-fredoka font-medium text-lg text-slate-900">{item.name}</h3>
                                            <p className="text-sm text-slate-500 leading-tight">{item.description}</p>
                                        </div>
                                        <div className="text-right">
                                            {isUnlocked ? (
                                                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => buyItem(item)}
                                                    disabled={points < item.price}
                                                    className="rounded-xl font-fredoka h-10 px-4"
                                                >
                                                    <Coins className="w-4 h-4 mr-2" />
                                                    {item.price}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
