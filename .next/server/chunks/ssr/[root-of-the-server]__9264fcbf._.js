module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/src/lib/storage.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "addAIMessage": (()=>addAIMessage),
    "addCycleEntry": (()=>addCycleEntry),
    "addFantasyEntry": (()=>addFantasyEntry),
    "addNotification": (()=>addNotification),
    "clearAllData": (()=>clearAllData),
    "deleteFantasyEntry": (()=>deleteFantasyEntry),
    "exportUserData": (()=>exportUserData),
    "getAIMessages": (()=>getAIMessages),
    "getCycleData": (()=>getCycleData),
    "getFantasyEntries": (()=>getFantasyEntries),
    "getIntimacyCards": (()=>getIntimacyCards),
    "getNotifications": (()=>getNotifications),
    "getOnboardingStatus": (()=>getOnboardingStatus),
    "getTheme": (()=>getTheme),
    "getUser": (()=>getUser),
    "markNotificationAsRead": (()=>markNotificationAsRead),
    "removeUser": (()=>removeUser),
    "saveAIMessages": (()=>saveAIMessages),
    "saveCycleData": (()=>saveCycleData),
    "saveFantasyEntries": (()=>saveFantasyEntries),
    "saveIntimacyCards": (()=>saveIntimacyCards),
    "saveNotifications": (()=>saveNotifications),
    "saveOnboardingStatus": (()=>saveOnboardingStatus),
    "saveTheme": (()=>saveTheme),
    "saveUser": (()=>saveUser),
    "updateFantasyEntry": (()=>updateFantasyEntry),
    "updateIntimacyCard": (()=>updateIntimacyCard)
});
const STORAGE_KEYS = {
    USER: 'shesync_user',
    CYCLE_DATA: 'shesync_cycle_data',
    AI_MESSAGES: 'shesync_ai_messages',
    INTIMACY_CARDS: 'shesync_intimacy_cards',
    FANTASY_ENTRIES: 'shesync_fantasy_entries',
    NOTIFICATIONS: 'shesync_notifications',
    THEME: 'shesync_theme',
    ONBOARDING: 'shesync_onboarding'
};
class LocalStorage {
    isClient = "undefined" !== 'undefined';
    setItem(key, value) {
        if (!this.isClient) return;
        try {
            const serializedValue = JSON.stringify(value, (key, val)=>{
                if (val instanceof Date) {
                    return {
                        __type: 'Date',
                        value: val.toISOString()
                    };
                }
                return val;
            });
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    getItem(key, defaultValue) {
        if (!this.isClient) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            const parsed = JSON.parse(item, (key, val)=>{
                if (val && typeof val === 'object' && val.__type === 'Date') {
                    return new Date(val.value);
                }
                return val;
            });
            return parsed;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    removeItem(key) {
        if (!this.isClient) return;
        localStorage.removeItem(key);
    }
    clear() {
        if (!this.isClient) return;
        Object.values(STORAGE_KEYS).forEach((key)=>{
            localStorage.removeItem(key);
        });
    }
}
const storage = new LocalStorage();
const saveUser = (user)=>{
    storage.setItem(STORAGE_KEYS.USER, user);
};
const getUser = ()=>{
    return storage.getItem(STORAGE_KEYS.USER, null);
};
const removeUser = ()=>{
    storage.removeItem(STORAGE_KEYS.USER);
};
const saveCycleData = (cycleData)=>{
    storage.setItem(STORAGE_KEYS.CYCLE_DATA, cycleData);
};
const getCycleData = ()=>{
    return storage.getItem(STORAGE_KEYS.CYCLE_DATA, []);
};
const addCycleEntry = (entry)=>{
    const existing = getCycleData();
    const updated = [
        ...existing.filter((e)=>e.id !== entry.id),
        entry
    ];
    saveCycleData(updated);
};
const saveAIMessages = (messages)=>{
    storage.setItem(STORAGE_KEYS.AI_MESSAGES, messages);
};
const getAIMessages = ()=>{
    return storage.getItem(STORAGE_KEYS.AI_MESSAGES, []);
};
const addAIMessage = (message)=>{
    const existing = getAIMessages();
    saveAIMessages([
        ...existing,
        message
    ]);
};
const saveIntimacyCards = (cards)=>{
    storage.setItem(STORAGE_KEYS.INTIMACY_CARDS, cards);
};
const getIntimacyCards = ()=>{
    return storage.getItem(STORAGE_KEYS.INTIMACY_CARDS, []);
};
const updateIntimacyCard = (cardId, updates)=>{
    const existing = getIntimacyCards();
    const updated = existing.map((card)=>card.id === cardId ? {
            ...card,
            ...updates
        } : card);
    saveIntimacyCards(updated);
};
const saveFantasyEntries = (entries)=>{
    storage.setItem(STORAGE_KEYS.FANTASY_ENTRIES, entries);
};
const getFantasyEntries = ()=>{
    return storage.getItem(STORAGE_KEYS.FANTASY_ENTRIES, []);
};
const addFantasyEntry = (entry)=>{
    const existing = getFantasyEntries();
    saveFantasyEntries([
        ...existing,
        entry
    ]);
};
const updateFantasyEntry = (entryId, updates)=>{
    const existing = getFantasyEntries();
    const updated = existing.map((entry)=>entry.id === entryId ? {
            ...entry,
            ...updates,
            updatedAt: new Date()
        } : entry);
    saveFantasyEntries(updated);
};
const deleteFantasyEntry = (entryId)=>{
    const existing = getFantasyEntries();
    const updated = existing.filter((entry)=>entry.id !== entryId);
    saveFantasyEntries(updated);
};
const saveNotifications = (notifications)=>{
    storage.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
};
const getNotifications = ()=>{
    return storage.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
};
const addNotification = (notification)=>{
    const existing = getNotifications();
    saveNotifications([
        notification,
        ...existing
    ]);
};
const markNotificationAsRead = (notificationId)=>{
    const existing = getNotifications();
    const updated = existing.map((notif)=>notif.id === notificationId ? {
            ...notif,
            isRead: true
        } : notif);
    saveNotifications(updated);
};
const saveTheme = (theme)=>{
    storage.setItem(STORAGE_KEYS.THEME, theme);
};
const getTheme = ()=>{
    return storage.getItem(STORAGE_KEYS.THEME, 'light');
};
const saveOnboardingStatus = (status)=>{
    storage.setItem(STORAGE_KEYS.ONBOARDING, status);
};
const getOnboardingStatus = ()=>{
    return storage.getItem(STORAGE_KEYS.ONBOARDING, false);
};
const exportUserData = ()=>{
    const data = {
        user: getUser(),
        cycleData: getCycleData(),
        aiMessages: getAIMessages(),
        intimacyCards: getIntimacyCards(),
        fantasyEntries: getFantasyEntries(),
        notifications: getNotifications(),
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
};
const clearAllData = ()=>{
    storage.clear();
};
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[project]/src/lib/mockData.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "generateCyclePredictions": (()=>generateCyclePredictions),
    "getPhaseColor": (()=>getPhaseColor),
    "getPhaseEmoji": (()=>getPhaseEmoji),
    "mockAIMessages": (()=>mockAIMessages),
    "mockAIResponses": (()=>mockAIResponses),
    "mockCycleData": (()=>mockCycleData),
    "mockFantasyEntries": (()=>mockFantasyEntries),
    "mockIntimacyCards": (()=>mockIntimacyCards),
    "mockNotifications": (()=>mockNotifications),
    "mockRecipes": (()=>mockRecipes),
    "mockUser": (()=>mockUser),
    "subscriptionPlans": (()=>subscriptionPlans)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/subDays.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/addDays.js [app-ssr] (ecmascript)");
;
;
const mockUser = {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
    email: 'sarah@example.com',
    name: 'Sarah',
    subscriptionTier: 'premium',
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 30),
    privacySettings: {
        shareWithPartner: true,
        shareCyclePhase: true,
        shareMood: true,
        shareFantasyVault: false,
        shareIntimacyDeck: true
    }
};
const mockCycleData = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        date: new Date(),
        phase: 'luteal',
        mood: 6,
        energy: 5,
        libido: 4,
        stress: 7,
        symptoms: [
            'Mild cramping',
            'Bloating',
            'Cravings'
        ],
        notes: 'Feeling a bit low energy today, craving chocolate',
        temperature: 98.2
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 1),
        phase: 'luteal',
        mood: 7,
        energy: 6,
        libido: 5,
        stress: 6,
        symptoms: [
            'Tender breasts',
            'Mild acne'
        ],
        notes: 'Better day, did some yoga',
        temperature: 98.4
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 7),
        phase: 'ovulation',
        mood: 9,
        energy: 9,
        libido: 8,
        stress: 3,
        symptoms: [
            'High energy',
            'Clear skin'
        ],
        notes: 'Amazing energy today! Felt really confident and social',
        temperature: 97.8
    }
];
const mockAIMessages = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        timestamp: new Date(),
        question: "Why do I feel so anxious today?",
        response: "Based on your cycle data, you're currently in your luteal phase, which is when progesterone levels drop. This can naturally increase anxiety and stress sensitivity. Your stress level today is 7/10, which is higher than your usual. Try some deep breathing exercises, magnesium supplementation, and gentle movement like yoga. Your body is preparing for your next cycle, so be extra kind to yourself.",
        phase: 'luteal',
        relevantData: {
            mood: 6,
            stress: 7,
            phase: 'luteal'
        }
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        timestamp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 2),
        question: "Should I do intense workouts today?",
        response: "During your luteal phase with energy at 5/10, I'd recommend switching to gentler forms of exercise. Your body is working hard with hormonal changes right now. Consider yoga, walking, or light strength training instead of high-intensity workouts. This will support your energy rather than depleting it further.",
        phase: 'luteal',
        relevantData: {
            energy: 5,
            phase: 'luteal'
        }
    }
];
const mockIntimacyCards = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        category: 'emotional',
        question: "What's one thing your partner does that makes you feel most loved?",
        description: "Explore love languages and emotional connection",
        tags: [
            'love languages',
            'emotional intimacy',
            'appreciation'
        ],
        isAnswered: true,
        userAnswer: "When he makes me tea without me asking, especially during my period",
        partnerAnswer: "When she laughs at my silly jokes even when she's tired",
        isShared: true
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        category: 'sensual',
        question: "Describe your ideal romantic evening together",
        description: "Share desires for romantic connection",
        tags: [
            'romance',
            'date night',
            'sensuality'
        ],
        isAnswered: false,
        isShared: false
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        category: 'fantasy',
        question: "If we could go anywhere in the world together, where would it be and why?",
        description: "Explore shared dreams and adventures",
        tags: [
            'dreams',
            'travel',
            'future plans'
        ],
        isAnswered: true,
        userAnswer: "A cozy cabin in Norway to see the Northern Lights together",
        isShared: false
    }
];
const mockFantasyEntries = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        title: "Weekend Getaway Dreams",
        content: "A romantic weekend at a spa resort with couples massages and no phones allowed",
        type: 'text',
        tags: [
            'relaxation',
            'spa',
            'romantic getaway'
        ],
        isSharedWithPartner: false,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 5),
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 5),
        mood: 8,
        phase: 'follicular'
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        title: "Dancing Under Stars",
        content: "Slow dancing in our living room with fairy lights and our favorite playlist",
        type: 'text',
        tags: [
            'dancing',
            'home',
            'intimate'
        ],
        isSharedWithPartner: true,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 10),
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 10),
        mood: 9,
        phase: 'ovulation'
    }
];
const mockNotifications = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        type: 'cycle',
        title: 'Cycle Phase Change',
        message: 'You\'re entering your luteal phase. Time for self-care and gentle activities.',
        isRead: false,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 1)
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        type: 'partner',
        title: 'Partner Message',
        message: 'Alex wants to plan a special date night this weekend',
        isRead: false,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 2)
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        type: 'intimacy',
        title: 'New Intimacy Card',
        message: 'Try tonight\'s intimate conversation starter',
        isRead: true,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(new Date(), 3)
    }
];
const subscriptionPlans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
            'Basic cycle tracking',
            '5 intimacy cards',
            'Simple mood logging',
            'Basic phase predictions'
        ]
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 15,
        interval: 'month',
        features: [
            'Advanced cycle tracking',
            'AI Coach unlimited',
            'Partner access & sharing',
            '100+ intimacy cards',
            'Detailed analytics',
            'Custom reminders'
        ],
        isPopular: true
    },
    {
        id: 'vip',
        name: 'VIP',
        price: 39,
        interval: 'month',
        features: [
            'Everything in Premium',
            'Fantasy Vault unlimited',
            'Custom rituals & soundscapes',
            'Advanced partner features',
            'Priority support',
            'Early access to new features'
        ]
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        price: 199,
        interval: 'lifetime',
        features: [
            'All current & future features',
            'Lifetime updates',
            'Premium data backup',
            'Exclusive community access',
            'Personal coach sessions'
        ]
    }
];
const mockRecipes = [
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        name: 'Hormone-Balancing Smoothie',
        description: 'Perfect for luteal phase with magnesium-rich ingredients',
        ingredients: [
            '1 cup spinach',
            '1 banana',
            '1 tbsp almond butter',
            '1 tsp cacao powder',
            '1 cup almond milk',
            '1 tbsp chia seeds'
        ],
        instructions: [
            'Blend all ingredients until smooth',
            'Add ice if desired',
            'Enjoy immediately for best nutrition'
        ],
        cyclePhase: [
            'luteal',
            'menstrual'
        ],
        nutrients: [
            'Magnesium',
            'Iron',
            'Healthy fats'
        ],
        prepTime: 5,
        difficulty: 'easy'
    },
    {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        name: 'Energy-Boosting Quinoa Bowl',
        description: 'High-protein meal perfect for follicular phase',
        ingredients: [
            '1 cup cooked quinoa',
            '1/2 avocado',
            '1 cup roasted vegetables',
            '2 tbsp pumpkin seeds',
            'Lemon tahini dressing'
        ],
        instructions: [
            'Combine quinoa and vegetables in bowl',
            'Top with avocado and seeds',
            'Drizzle with dressing'
        ],
        cyclePhase: [
            'follicular',
            'ovulation'
        ],
        nutrients: [
            'Protein',
            'Healthy fats',
            'Complex carbs'
        ],
        prepTime: 15,
        difficulty: 'medium'
    }
];
const mockAIResponses = {
    'cycle': "Based on your current luteal phase and recent symptoms, your body is preparing for your next cycle. This is completely normal! I recommend focusing on magnesium-rich foods, gentle movement, and extra rest.",
    'mood': "Your mood patterns show you're experiencing typical hormonal fluctuations. During this phase, try some mood-supporting activities like journaling, calling a friend, or doing something creative.",
    'energy': "Your energy levels align with your current cycle phase. Consider adapting your workout routine - maybe swap that HIIT class for some yoga or a peaceful walk in nature.",
    'relationship': "Communication is key during hormonal shifts. Let your partner know how you're feeling and what kind of support would be most helpful right now.",
    'default': "I'm here to help you understand your body's natural rhythms. Based on your cycle data, I can provide personalized insights about your symptoms, energy levels, and what to expect in the coming days."
};
const generateCyclePredictions = (lastPeriodDate, cycleLength = 28)=>{
    const predictions = [];
    const today = new Date();
    for(let i = 0; i < 90; i++){
        const date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(today, i);
        const dayInCycle = (date.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24) % cycleLength;
        let phase;
        if (dayInCycle >= 0 && dayInCycle < 5) phase = 'menstrual';
        else if (dayInCycle < 13) phase = 'follicular';
        else if (dayInCycle < 17) phase = 'ovulation';
        else phase = 'luteal';
        predictions.push({
            date,
            phase,
            dayInCycle: Math.floor(dayInCycle) + 1
        });
    }
    return predictions;
};
const getPhaseEmoji = (phase)=>{
    const emojis = {
        menstrual: '🌙',
        follicular: '🌱',
        ovulation: '🌟',
        luteal: '🍂'
    };
    return emojis[phase];
};
const getPhaseColor = (phase)=>{
    const colors = {
        menstrual: 'bg-red-100 text-red-800',
        follicular: 'bg-green-100 text-green-800',
        ovulation: 'bg-yellow-100 text-yellow-800',
        luteal: 'bg-orange-100 text-orange-800'
    };
    return colors[phase];
};
}}),
"[project]/src/context/AppContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AppProvider": (()=>AppProvider),
    "useApp": (()=>useApp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/storage.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mockData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const initialState = {
    user: null,
    partner: null,
    cycleData: [],
    aiMessages: [],
    intimacyCards: [],
    fantasyEntries: [],
    notifications: [],
    currentPhase: 'luteal',
    isDarkMode: false,
    isLoading: true
};
const appReducer = (state, action)=>{
    switch(action.type){
        case 'SET_USER':
            return {
                ...state,
                user: action.payload
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
        case 'SET_THEME':
            return {
                ...state,
                isDarkMode: action.payload
            };
        case 'SET_CYCLE_DATA':
            return {
                ...state,
                cycleData: action.payload
            };
        case 'ADD_CYCLE_ENTRY':
            return {
                ...state,
                cycleData: [
                    ...state.cycleData.filter((e)=>e.id !== action.payload.id),
                    action.payload
                ],
                currentPhase: action.payload.phase
            };
        case 'SET_AI_MESSAGES':
            return {
                ...state,
                aiMessages: action.payload
            };
        case 'ADD_AI_MESSAGE':
            return {
                ...state,
                aiMessages: [
                    ...state.aiMessages,
                    action.payload
                ]
            };
        case 'SET_INTIMACY_CARDS':
            return {
                ...state,
                intimacyCards: action.payload
            };
        case 'UPDATE_INTIMACY_CARD':
            return {
                ...state,
                intimacyCards: state.intimacyCards.map((card)=>card.id === action.payload.cardId ? {
                        ...card,
                        ...action.payload.updates
                    } : card)
            };
        case 'SET_FANTASY_ENTRIES':
            return {
                ...state,
                fantasyEntries: action.payload
            };
        case 'ADD_FANTASY_ENTRY':
            return {
                ...state,
                fantasyEntries: [
                    ...state.fantasyEntries,
                    action.payload
                ]
            };
        case 'UPDATE_FANTASY_ENTRY':
            return {
                ...state,
                fantasyEntries: state.fantasyEntries.map((entry)=>entry.id === action.payload.entryId ? {
                        ...entry,
                        ...action.payload.updates,
                        updatedAt: new Date()
                    } : entry)
            };
        case 'SET_NOTIFICATIONS':
            return {
                ...state,
                notifications: action.payload
            };
        case 'MARK_NOTIFICATION_READ':
            return {
                ...state,
                notifications: state.notifications.map((notif)=>notif.id === action.payload ? {
                        ...notif,
                        isRead: true
                    } : notif)
            };
        case 'INITIALIZE_APP':
            return {
                ...state,
                ...action.payload,
                isLoading: false
            };
        default:
            return state;
    }
};
const AppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useApp = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
const AppProvider = ({ children })=>{
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"])(appReducer, initialState);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Initialize app with stored data or mock data
        const initializeApp = ()=>{
            const storedUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUser"])();
            const isDarkMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTheme"])() === 'dark';
            if (storedUser) {
                // Load user's data
                const cycleData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCycleData"])();
                const aiMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAIMessages"])();
                const intimacyCards = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getIntimacyCards"])();
                const fantasyEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFantasyEntries"])();
                const notifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNotifications"])();
                dispatch({
                    type: 'INITIALIZE_APP',
                    payload: {
                        user: storedUser,
                        cycleData,
                        aiMessages,
                        intimacyCards,
                        fantasyEntries,
                        notifications,
                        currentPhase: cycleData[cycleData.length - 1]?.phase || 'luteal',
                        isDarkMode
                    }
                });
            } else {
                // For demo purposes, load mock data
                dispatch({
                    type: 'INITIALIZE_APP',
                    payload: {
                        user: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockUser"],
                        cycleData: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockCycleData"],
                        aiMessages: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockAIMessages"],
                        intimacyCards: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockIntimacyCards"],
                        fantasyEntries: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockFantasyEntries"],
                        notifications: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockNotifications"],
                        currentPhase: 'luteal',
                        isDarkMode
                    }
                });
                // Save mock user for demo
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveUser"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockUser"]);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveCycleData"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockCycleData"]);
            }
        };
        // Simulate loading time
        setTimeout(initializeApp, 1000);
    }, []);
    const login = (user)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveUser"])(user);
        dispatch({
            type: 'SET_USER',
            payload: user
        });
    };
    const logout = ()=>{
        dispatch({
            type: 'SET_USER',
            payload: null
        });
    // Note: We don't clear all data for privacy, just log out
    };
    const toggleTheme = ()=>{
        const newTheme = !state.isDarkMode;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveTheme"])(newTheme ? 'dark' : 'light');
        dispatch({
            type: 'SET_THEME',
            payload: newTheme
        });
    };
    const addCycleEntry = (entry)=>{
        const updatedData = [
            ...state.cycleData.filter((e)=>e.id !== entry.id),
            entry
        ];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveCycleData"])(updatedData);
        dispatch({
            type: 'ADD_CYCLE_ENTRY',
            payload: entry
        });
    };
    const addAIMessage = (message)=>{
        dispatch({
            type: 'ADD_AI_MESSAGE',
            payload: message
        });
    };
    const updateIntimacyCard = (cardId, updates)=>{
        dispatch({
            type: 'UPDATE_INTIMACY_CARD',
            payload: {
                cardId,
                updates
            }
        });
    };
    const addFantasyEntry = (entry)=>{
        dispatch({
            type: 'ADD_FANTASY_ENTRY',
            payload: entry
        });
    };
    const updateFantasyEntry = (entryId, updates)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateFantasyEntry"])(entryId, updates);
        dispatch({
            type: 'UPDATE_FANTASY_ENTRY',
            payload: {
                entryId,
                updates
            }
        });
    };
    const markNotificationAsRead = (notificationId)=>{
        dispatch({
            type: 'MARK_NOTIFICATION_READ',
            payload: notificationId
        });
    };
    const value = {
        state,
        dispatch,
        login,
        logout,
        toggleTheme,
        addCycleEntry,
        addAIMessage,
        updateIntimacyCard,
        addFantasyEntry,
        updateFantasyEntry,
        markNotificationAsRead
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AppContext.tsx",
        lineNumber: 259,
        columnNumber: 5
    }, this);
};
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    } else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else {
                "TURBOPACK unreachable";
            }
        } else {
            "TURBOPACK unreachable";
        }
    }
} //# sourceMappingURL=module.compiled.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}}),
"[project]/node_modules/uuid/dist/esm/native.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const __TURBOPACK__default__export__ = {
    randomUUID: __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"]
};
}}),
"[project]/node_modules/uuid/dist/esm/rng.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>rng)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomFillSync"])(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
}}),
"[project]/node_modules/uuid/dist/esm/regex.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
const __TURBOPACK__default__export__ = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
}}),
"[project]/node_modules/uuid/dist/esm/validate.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$regex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/regex.js [app-ssr] (ecmascript)");
;
function validate(uuid) {
    return typeof uuid === 'string' && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$regex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].test(uuid);
}
const __TURBOPACK__default__export__ = validate;
}}),
"[project]/node_modules/uuid/dist/esm/stringify.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__),
    "unsafeStringify": (()=>unsafeStringify)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$validate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/validate.js [app-ssr] (ecmascript)");
;
const byteToHex = [];
for(let i = 0; i < 256; ++i){
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$validate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
const __TURBOPACK__default__export__ = stringify;
}}),
"[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$native$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/native.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$rng$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/rng.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$stringify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/stringify.js [app-ssr] (ecmascript)");
;
;
;
function v4(options, buf, offset) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$native$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].randomUUID && !buf && !options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$native$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$rng$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for(let i = 0; i < 16; ++i){
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$stringify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unsafeStringify"])(rnds);
}
const __TURBOPACK__default__export__ = v4;
}}),
"[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "v4": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript)");
}}),
"[project]/node_modules/date-fns/constants.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @module constants
 * @summary Useful constants
 * @description
 * Collection of useful date constants.
 *
 * The constants could be imported from `date-fns/constants`:
 *
 * ```ts
 * import { maxTime, minTime } from "./constants/date-fns/constants";
 *
 * function isAllowedTime(time) {
 *   return time <= maxTime && time >= minTime;
 * }
 * ```
 */ /**
 * @constant
 * @name daysInWeek
 * @summary Days in 1 week.
 */ __turbopack_context__.s({
    "constructFromSymbol": (()=>constructFromSymbol),
    "daysInWeek": (()=>daysInWeek),
    "daysInYear": (()=>daysInYear),
    "maxTime": (()=>maxTime),
    "millisecondsInDay": (()=>millisecondsInDay),
    "millisecondsInHour": (()=>millisecondsInHour),
    "millisecondsInMinute": (()=>millisecondsInMinute),
    "millisecondsInSecond": (()=>millisecondsInSecond),
    "millisecondsInWeek": (()=>millisecondsInWeek),
    "minTime": (()=>minTime),
    "minutesInDay": (()=>minutesInDay),
    "minutesInHour": (()=>minutesInHour),
    "minutesInMonth": (()=>minutesInMonth),
    "minutesInYear": (()=>minutesInYear),
    "monthsInQuarter": (()=>monthsInQuarter),
    "monthsInYear": (()=>monthsInYear),
    "quartersInYear": (()=>quartersInYear),
    "secondsInDay": (()=>secondsInDay),
    "secondsInHour": (()=>secondsInHour),
    "secondsInMinute": (()=>secondsInMinute),
    "secondsInMonth": (()=>secondsInMonth),
    "secondsInQuarter": (()=>secondsInQuarter),
    "secondsInWeek": (()=>secondsInWeek),
    "secondsInYear": (()=>secondsInYear)
});
const daysInWeek = 7;
const daysInYear = 365.2425;
const maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1000;
const minTime = -maxTime;
const millisecondsInWeek = 604800000;
const millisecondsInDay = 86400000;
const millisecondsInMinute = 60000;
const millisecondsInHour = 3600000;
const millisecondsInSecond = 1000;
const minutesInYear = 525600;
const minutesInMonth = 43200;
const minutesInDay = 1440;
const minutesInHour = 60;
const monthsInQuarter = 3;
const monthsInYear = 12;
const quartersInYear = 4;
const secondsInHour = 3600;
const secondsInMinute = 60;
const secondsInDay = secondsInHour * 24;
const secondsInWeek = secondsInDay * 7;
const secondsInYear = secondsInDay * daysInYear;
const secondsInMonth = secondsInYear / 12;
const secondsInQuarter = secondsInMonth * 3;
const constructFromSymbol = Symbol.for("constructDateFrom");
}}),
"[project]/node_modules/date-fns/constructFrom.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "constructFrom": (()=>constructFrom),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/constants.js [app-ssr] (ecmascript)");
;
function constructFrom(date, value) {
    if (typeof date === "function") return date(value);
    if (date && typeof date === "object" && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constructFromSymbol"] in date) return date[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constructFromSymbol"]](value);
    if (date instanceof Date) return new date.constructor(value);
    return new Date(value);
}
const __TURBOPACK__default__export__ = constructFrom;
}}),
"[project]/node_modules/date-fns/toDate.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__),
    "toDate": (()=>toDate)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/constructFrom.js [app-ssr] (ecmascript)");
;
function toDate(argument, context) {
    // [TODO] Get rid of `toDate` or `constructFrom`?
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constructFrom"])(context || argument, argument);
}
const __TURBOPACK__default__export__ = toDate;
}}),
"[project]/node_modules/date-fns/addDays.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "addDays": (()=>addDays),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/constructFrom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/toDate.js [app-ssr] (ecmascript)");
;
;
function addDays(date, amount, options) {
    const _date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toDate"])(date, options?.in);
    if (isNaN(amount)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["constructFrom"])(options?.in || date, NaN);
    // If 0 days, no-op to avoid changing times in the hour before end of DST
    if (!amount) return _date;
    _date.setDate(_date.getDate() + amount);
    return _date;
}
const __TURBOPACK__default__export__ = addDays;
}}),
"[project]/node_modules/date-fns/subDays.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__),
    "subDays": (()=>subDays)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/addDays.js [app-ssr] (ecmascript)");
;
function subDays(date, amount, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(date, -amount, options);
}
const __TURBOPACK__default__export__ = subDays;
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__9264fcbf._.js.map