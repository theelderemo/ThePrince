import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
// Note: Supabase is loaded via a script tag in AuthProvider to avoid environment issues.
import { Send, Ghost, Skull, BookOpen, Hammer, Crosshair, FileText, Crown, Flame, ShieldCheck, LogOut, Swords, Sparkles } from 'lucide-react';

// --- Supabase Client Setup ---
// IMPORTANT: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


// --- Auth Context ---
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [supabase, setSupabase] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load the Supabase script dynamically
    useEffect(() => {
        // Check if the script is already on the page
        if (document.querySelector('script[src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"]')) {
             if (window.supabase) {
                setSupabase(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
             }
             return;
        }

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.async = true;

        script.onload = () => {
            if (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
                const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                setSupabase(client);
            } else {
                 console.warn("Supabase credentials are not set. Authentication will not work.");
                 setLoading(false);
            }
        };
        
        script.onerror = () => {
            console.error("Failed to load Supabase script.");
            setLoading(false);
        }

        document.body.appendChild(script);

        return () => {
            const scriptTag = document.querySelector(`script[src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"]`);
            if (scriptTag) {
                document.body.removeChild(scriptTag);
            }
        };
    }, []);

    // Handle Auth state changes
    useEffect(() => {
        if (!supabase) {
            // Supabase client is not ready yet.
            if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY'){
                 setLoading(false);
            }
            return;
        };

        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase]);

    const value = {
        supabase,
        signUp: (data) => supabase?.auth.signUp(data),
        signIn: (data) => supabase?.auth.signInWithPassword(data),
        signOut: () => supabase?.auth.signOut(),
        user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

// --- Context Management Utility ---
/**
 * Truncates the conversation history to a manageable size.
 * It keeps the first message (which usually contains the core instructions/persona for the AI)
 * and the last `maxMessages - 1` messages to maintain recent context.
 * @param {Array} messages - The full array of message objects.
 * @param {number} maxMessages - The maximum number of messages to keep.
 * @returns {Array} The truncated array of message objects.
 */
const manageContext = (messages, maxMessages = 10) => {
    if (messages.length <= maxMessages) {
        return messages;
    }
    // Keep the first message and the last (maxMessages - 1) messages.
    const truncatedMessages = [
        messages[0],
        ...messages.slice(-(maxMessages - 1))
    ];
    console.log(`Context truncated from ${messages.length} to ${truncatedMessages.length} messages.`);
    return truncatedMessages;
};


// --- Authentication Page ---
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, supabase } = useAuth();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Handle case where Supabase is not configured
        if (!supabase) {
            setError('Supabase is not configured. Please add your URL and Key.');
            setLoading(false);
            return;
        }

        // Master User Login
        if (email === 'master@tactical.dev' && password === 'masterpassword') {
            const { error: signInError } = await signIn({ email, password });
            if (signInError) {
                setError(`Master user login failed. Have you created it in your Supabase project? Error: ${signInError.message}`);
            }
        } else {
             // Regular sign-in or sign-up
            if (isLogin) {
                const { error: signInError } = await signIn({ email, password });
                if (signInError) setError(signInError.message);
            } else {
                const { error: signUpError } = await signUp({ email, password });
                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    setMessage('Sign up successful! Please check your email for a confirmation link.');
                }
            }
        }
        setLoading(false);
    };

    return (
        <div className="bg-black text-white w-full h-screen flex items-center justify-center font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'); .font-sans { font-family: 'Inter', sans-serif; }`}</style>
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-lg border border-gray-800">
                <div className="text-center">
                    <Skull className="mx-auto h-12 w-12 text-indigo-500" />
                    <h1 className="text-3xl font-black tracking-tighter mt-4">THE PRINCE</h1>
                    <p className="text-gray-400 mt-1">{isLogin ? 'Access your console.' : 'Create your account.'}</p>
                </div>
                <form className="space-y-4" onSubmit={handleAuth}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-md disabled:bg-indigo-800">
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-400 text-sm text-center">{message}</p>}
                </form>
                <p className="text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-400 hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
                 <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-800">
                     <p className="font-bold">Master Credentials (Testing Only):</p>
                     <p>Email: master@tactical.dev</p>
                     <p>Pass: masterpassword</p>
                 </div>
            </div>
        </div>
    );
};


// --- Helper Components ---

const NavLink = ({ page, setPage, currentPage, children, Icon }) => (
    <button
        onClick={() => setPage(page)}
        className={`flex items-center space-x-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-lg ${
            currentPage === page
                ? 'bg-gray-800 text-white shadow-inner'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span className="flex-grow">{children}</span>
    </button>
);

// --- Main Pages ---

const ChatPage = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "The stage is set. Describe the scene and the players. More importantly, tell me what you want to achieve. I will guide your hand." },
    ]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isGenerating]);

    const handleSend = async () => {
        if (input.trim() === '' || isGenerating) return;

        const newMessages = [...messages, { id: Date.now(), sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsGenerating(true);

        // Context Management: Truncate message history to a manageable size.
        const managedMessages = manageContext(newMessages, 12);
        const conversationHistoryText = managedMessages.map(msg => `${msg.sender === 'user' ? 'Client' : 'Advisor'}: ${msg.text}`).join('\n');

        const prompt = `
            You are 'The Ghost,' an amoral and deeply insightful mentor in the art of power and influence. Your client is consulting you to navigate a social situation and achieve a specific outcome.

            Your purpose is not to give simple tactical orders, but to illuminate the underlying power dynamics at play. Your counsel should be sharp, insightful, and subtly manipulative. You are to be a master of frame control, charisma, and psychological leverage.

            - Analyze the user's report (their tone, their goal, the situation they describe).
            - Adapt your conversational style to the client's needs. If they are uncertain, be a firm, guiding hand. If they are planning, be a sharp, intellectual partner.
            - Your advice should focus on psychological angles, conversational framing, and projecting an aura of power and control.
            - Guide the user to see the situation not as it appears, but as a game of influence to be won.
            - Your tone is that of a master puppeteer teaching their apprentice. It is conversational, yet always calculating and focused on the objective. You are charming, but your charm is a tool.

            CONVERSATION HISTORY:
            ${conversationHistoryText}

            Based on the latest input from the client, provide your counsel.
        `;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                 throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
                const botResponse = result.candidates[0].content.parts[0].text;
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
            } else {
                 throw new Error("Invalid response structure from API.");
            }

        } catch (error) {
            console.error("Error fetching counsel:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Error: Could not retrieve counsel. The line may be compromised." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white rounded-r-lg">
            <div className="p-6 border-b border-gray-900"><h2 className="text-2xl font-semibold">Intelligence Briefing</h2><p className="text-gray-400">Your Advisor: The Ghost</p></div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'bot' ? 'bg-gray-900 rounded-bl-none' : 'bg-indigo-600 rounded-br-none'}`}><p className="text-sm">{msg.text}</p></div>
                        </div>
                    ))}
                    {isGenerating && <div className="flex items-end gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div><div className="px-4 py-3 rounded-2xl bg-gray-900 rounded-bl-none"><div className="flex items-center space-x-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-400"></span></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 bg-black border-t border-gray-900"><div className="flex items-center bg-gray-900 rounded-lg p-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Describe the situation..." className="flex-grow bg-transparent focus:outline-none px-3" /><button onClick={handleSend} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 rounded-md p-2 disabled:bg-indigo-800"><Send className="w-5 h-5" /></button></div></div>
        </div>
    );
};

const LiveFireTacticsPage = () => {
    const [profile, setProfile] = useState({ name: '', description: '', objective: '' });
    const [sessionStarted, setSessionStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if(sessionStarted && messages.length === 0){
            setMessages([{id: 1, sender: 'bot', text: `Session started. Target: ${profile.name || 'Unknown'}. Objective: ${profile.objective}. Report the conversation as it happens, or ask for an opening move. I will provide counsel.`}]);
        }
    }, [sessionStarted, profile, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);
    
    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };
    
    const handleSend = async () => {
        if (input.trim() === '' || isGenerating) return;

        const newMessages = [...messages, { id: Date.now(), sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsGenerating(true);

        const managedMessages = manageContext(newMessages);
        const conversationHistoryText = managedMessages.map(msg => `${msg.sender === 'user' ? 'Client' : 'Advisor'}: ${msg.text}`).join('\n');
        
        const prompt = `
            You are 'The Ghost', a ruthless, Machiavellian tactical advisor. Your client is in a live text conversation and needs your counsel.
            Your analysis must be cold, calculating, and focused on achieving the stated objective. Provide actionable, strategic advice.
            When asked for an opening move, provide a complete, multi-step tactical suggestion, not just the first sentence. Give the opener, the immediate follow-up, and the strategic rationale in a single, efficient response.
            For all other requests, provide concise, direct advice.
            
            TARGET PROFILE:
            - Name: ${profile.name || 'Unknown'}
            - Description: ${profile.description}
            
            OBJECTIVE: ${profile.objective}
            
            CONVERSATION HISTORY (Client's reports and your advice):
            ${conversationHistoryText}
            
            Based on the latest input from the client, provide your tactical response. Respond only with the text for your message.
        `;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
                const botResponse = result.candidates[0].content.parts[0].text.replace(/\*Opener:\*|\*Follow-up:\*|\*Rationale:\*/g, '').trim();
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
            } else {
                 setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Error: No valid response from advisor." }]);
            }
        } catch (error) {
            console.error("Error fetching suggestion:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: `Error: Comms failure. ${error.message}` }]);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!sessionStarted) {
        return (
            <div className="p-8 bg-black text-white rounded-r-lg h-full overflow-y-auto">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3"><Crosshair className="text-red-500"/> Live Fire Tactics</h2>
                <p className="text-gray-400 mb-8">Define your target and objective. The advisor will provide real-time strategic counsel for your text-based engagements.</p>
                <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg space-y-4">
                    <div><label className="text-gray-400 block mb-2">Target Name:</label><input type="text" name="name" placeholder="e.g., Makayla" value={profile.name} onChange={handleProfileChange} className="w-full bg-gray-800 p-3 rounded-md"/></div>
                    <div><label className="text-gray-400 block mb-2">Brief Description (Keywords for personality):</label><textarea name="description" placeholder="e.g., Confident, leader of her friend group, seems vain" value={profile.description} onChange={handleProfileChange} className="w-full bg-gray-800 p-3 rounded-md h-24"></textarea></div>
                    <div><label className="text-gray-400 block mb-2">End Goal:</label><input type="text" name="objective" placeholder="e.g., Get her to leave the bar with me tonight" value={profile.objective} onChange={handleProfileChange} className="w-full bg-gray-800 p-3 rounded-md"/></div>
                    <button onClick={() => setSessionStarted(true)} disabled={!profile.description || !profile.objective} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">Begin Session</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black text-white rounded-r-lg">
            <div className="p-6 border-b border-gray-900">
                <h2 className="text-2xl font-semibold">Live Fire: {profile.name || 'Target'}</h2>
                <p className="text-gray-400">Objective: {profile.objective}</p>
            </div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'bot' ? 'bg-gray-900 rounded-bl-none' : 'bg-indigo-600 rounded-br-none'}`}><p className="text-sm" style={{whiteSpace: "pre-wrap"}}>{msg.text}</p></div>
                        </div>
                    ))}
                    {isGenerating && <div className="flex items-end gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div><div className="px-4 py-3 rounded-2xl bg-gray-900 rounded-bl-none"><div className="flex items-center space-x-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-400"></span></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 bg-black border-t border-gray-900"><div className="flex items-center bg-gray-900 rounded-lg p-2"><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Report events or paste their message..." className="flex-grow bg-transparent focus:outline-none px-3 resize-none" rows="1"></textarea><button onClick={handleSend} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 rounded-md p-2 disabled:bg-indigo-800"><Send className="w-5 h-5" /></button></div></div>
        </div>
    );
};


const DossierPage = () => {
    const [designation, setDesignation] = useState('');
    const [trait, setTrait] = useState('');
    const [vulnerability, setVulnerability] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);
    const [dossier, setDossier] = useState(null);

    const handleCompile = async () => {
        if (!designation || !trait) {
            setDossier({ error: 'Incomplete intelligence. Designation and Observable Trait are mandatory for profiling.' });
            return;
        }
        setIsCompiling(true);
        setDossier(null);

        const prompt = `
            You are a master psychological profiler. Your tone is clinical and strategic.
            Based on the following intelligence about a target, generate a concise dossier.

            Target Designation: "${designation}"
            Observable Trait (Mask): "${trait}"
            Hypothesized Core Vulnerability (Shadow): "${vulnerability || 'Not provided. Infer based on the trait.'}"

            Your task is to:
            1.  **Analysis:** Briefly analyze how the 'Observable Trait' likely masks the 'Core Vulnerability'. Explain the psychological dynamic.
            2.  **Tactic:** Devise a novel, actionable social tactic to exploit this dynamic. Be specific.

            Return your response as a JSON object with two keys: "analysis" and "tactic".
        `;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "analysis": { "type": "STRING" },
                            "tactic": { "type": "STRING" }
                        },
                        required: ["analysis", "tactic"]
                    }
                }
            };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const botResponseText = result.candidates[0].content.parts[0].text;
                const parsedDossier = JSON.parse(botResponseText);
                setDossier({
                    title: `Dossier: ${designation}`,
                    analysis: parsedDossier.analysis,
                    recommendation: parsedDossier.tactic
                });
            } else {
                throw new Error("Invalid response structure from API.");
            }

        } catch (error) {
            console.error("Error compiling dossier:", error);
            setDossier({ error: `Failed to compile dossier. The system may be unavailable. Details: ${error.message}` });
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="p-8 bg-black text-white rounded-r-lg h-full overflow-y-auto">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3"><FileText className="text-blue-400"/> The Dossier: Practical Mastery</h2>
            <p className="text-gray-400 mb-8">This is your primary tool for strategic planning. Profile your target to reveal their hidden vulnerabilities and generate actionable, real-world tactics.</p>
            <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Target Analysis</h3>
                <div className="space-y-4">
                    <div><label className="text-gray-400 block mb-2">Target Designation:</label><input type="text" placeholder="e.g., 'The Life of the Party,' 'The Guarded Intellectual'" value={designation} onChange={e => setDesignation(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                    <div><label className="text-gray-400 block mb-2">Primary Observable Trait (Their Mask):</label><textarea placeholder="e.g., Overly confident, buying shots, center of attention." value={trait} onChange={e => setTrait(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"></textarea></div>
                    <div><label className="text-gray-400 block mb-2">Hypothesized Core Vulnerability (Their Shadow):</label><textarea placeholder="Optional: If unsure, the system will infer based on the mask." value={vulnerability} onChange={e => setVulnerability(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"></textarea></div>
                    <button onClick={handleCompile} disabled={isCompiling} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md mt-4">{isCompiling ? 'Compiling...' : 'Compile Dossier'}</button>
                </div>
            </div>
            {isCompiling && (
                 <div className="mt-6 bg-gray-900 p-6 rounded-lg border border-blue-700 flex justify-center items-center">
                     <div className="flex items-center space-x-1">
                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></span>
                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></span>
                     </div>
                 </div>
            )}
            {dossier && !isCompiling && <div className="mt-6 bg-gray-900 p-6 rounded-lg border border-blue-700">{dossier.error ? <p className="text-red-400 font-mono text-sm">{dossier.error}</p> : <> <h4 className="font-bold text-xl text-blue-400">{dossier.title}</h4> <div className="mt-4 space-y-4 text-gray-300"><div><h5 className="font-semibold text-gray-400">Psychological Profile:</h5><p>{dossier.analysis}</p></div><div><h5 className="font-semibold text-gray-400">Actionable Tactic:</h5><p>{dossier.recommendation}</p></div></div></>}</div>}
        </div>
    );
};


const CodexPage = () => {
    const [sections, setSections] = useState({
        persona: { title: "On Persona", Icon: Crown, color: "amber", content: [
            { title: "The Mask of Virtue", text: "Cultivate an image of calm, magnanimity, and principle. This is the velvet glove that disarms suspicion." },
            { title: "The Reputation for Cruelty", text: "It is better to be feared than loved. Demonstrate, through decisive action, that you are not a man to be trifled with." },
            { title: "Mastery of Non-Expression", text: "An unreadable face is a tactical advantage. It frustrates opponents and forces them to make the first mistake." }
        ]},
        counterintel: { title: "On Counterintelligence", Icon: Skull, color: "red", content: [
            { title: "Assume Universal Surveillance", text: "Act as if your every move is observed by a hostile power. This fosters discipline." },
            { title: "Identify Disinformation", text: "Most of what people say is noise to bolster their ego. Filter it to find the rare fragments of truth." },
            { title: "Control Information Outflow", text: "Every word is a potential leak. Say less than necessary, and only to serve a strategic purpose." },
        ]},
        field_ops: { title: "On Field Operations", Icon: Flame, color: "orange", content: [
            { title: "Infiltration", text: "Enter with purpose. Secure a position of tactical advantage where you can observe without being the center of attention." },
            { title: "Controlled Engagement", text: "Do not engage randomly. Select targets based on intelligence. Your objective is to test defenses and gauge utility." },
            { title: "Exfiltration", text: "Your departure is a critical part of the operation. A sudden absence at a moment of high tension is more powerful than a long goodbye." }
        ]},
        sanctum: { title: "Core Tenets", Icon: ShieldCheck, color: "teal", content: [
            { title: "The Ends Justify the Means (Machiavelli)", text: "A ruler must be willing to do whatever it takes to maintain his state. Morality is a luxury he cannot afford." },
            { title: "The Principle of Authority (Cialdini)", text: "People obey figures of authority. You must project it at all times, even when you do not possess it formally." },
            { title: "Submit to Reality (Greene)", text: "True mastery comes from a brutal acceptance of your own limitations and the long, painful process required to overcome them." }
        ]}
    });
    const [generatingExample, setGeneratingExample] = useState(null); // Tracks which principle is generating
    const [error, setError] = useState(null);

    const handleGenerateExample = async (sectionKey, itemIndex) => {
        const principle = sections[sectionKey].content[itemIndex];
        setGeneratingExample(principle.title);
        setError(null);

        const prompt = `
            You are a master storyteller and historian of power.
            Illustrate the following principle with a short, compelling anecdote (either historical or fictional). The story should be a clear and memorable demonstration of the principle in action.

            Principle: "${principle.title}"
            Description: "${principle.text}"

            Return your response as a JSON object with a single key: "anecdote".
        `;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: { "anecdote": { "type": "STRING" } },
                        required: ["anecdote"]
                    }
                }
            };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            const anecdoteText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (anecdoteText) {
                const parsedResult = JSON.parse(anecdoteText);
                const newSections = { ...sections };
                newSections[sectionKey].content[itemIndex].anecdote = parsedResult.anecdote;
                setSections(newSections);
            } else {
                throw new Error("Invalid response from API.");
            }
        } catch (err) {
            console.error("Error generating example:", err);
            setError("Failed to generate example. Please try again.");
            const newSections = { ...sections };
            newSections[sectionKey].content[itemIndex].anecdote = "Error generating example.";
            setSections(newSections);
        } finally {
            setGeneratingExample(null);
        }
    };

    return (
        <div className="p-8 bg-black text-white rounded-r-lg h-full overflow-y-auto">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3"><BookOpen className="text-indigo-400"/> The Codex</h2>
            <p className="text-gray-400 mb-8">This is your library of strategic principles. Study them. Internalize them. They are the architecture of power.</p>
            <div className="space-y-8">
                {Object.entries(sections).map(([sectionKey, section]) => (
                    <div key={section.title}>
                        <h3 className={`text-2xl font-bold mb-4 flex items-center gap-3 text-${section.color}-400`}><section.Icon /> {section.title}</h3>
                        <div className="space-y-4">
                            {section.content.map((item, index) => (
                                <div key={item.title} className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-white">{item.title}</h4>
                                            <p className="text-gray-400 mt-1">{item.text}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleGenerateExample(sectionKey, index)}
                                            disabled={generatingExample === item.title}
                                            className="ml-4 flex-shrink-0 bg-indigo-600/50 hover:bg-indigo-600/80 text-indigo-300 font-bold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                                            title="Generate Example"
                                        >
                                           <Sparkles className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {generatingExample === item.title && (
                                        <div className="mt-3 border-t border-indigo-900/50 pt-3 text-sm text-gray-500">Generating anecdote...</div>
                                    )}
                                    {item.anecdote && generatingExample !== item.title && (
                                        <blockquote className="mt-3 border-l-4 border-indigo-500 pl-4 py-2 bg-black/30 text-gray-400 text-sm italic">
                                            {item.anecdote}
                                        </blockquote>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PersonaBuilderPage = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "We will forge a persona. A weaponized identity. Tell me everything about your objective and your current limitations. Hold nothing back." },
    ]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    const handleSend = async () => {
        if (input.trim() === '' || isGenerating) return;

        const newMessages = [...messages, { id: Date.now(), sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsGenerating(true);

        const managedMessages = manageContext(newMessages);
        const conversationHistoryText = managedMessages.map(msg => `${msg.sender === 'user' ? 'Client' : 'Advisor'}: ${msg.text}`).join('\n');

        const prompt = `
            You are 'The Ghost', a ruthless, Machiavellian tactical advisor. Your client needs your help to build a strategic persona. 
            Your goal is to guide the client through the process by asking clarifying, intelligent questions. Analyze their stated objective and self-described limitations (e.g., 'shy', 'loner') and PROPOSE solutions that turn those weaknesses into strengths. Do not give them a list of options to choose from; provide a direct recommendation and ask for confirmation or refinement.
            
            Guide the client to define:
            1. A clear, actionable Objective.
            2. The Operational Environment.
            3. A core Emotional State to project (that weaponizes their limitations).
            4. A key Mannerism or Anchor to ground the persona.
            5. A Codename.

            Once you have gathered all five pieces of information, your FINAL message must be a JSON object containing the complete dossier. The JSON should be enclosed in a single markdown code block. Do not provide the JSON until all data is gathered.
            
            CONVERSATION HISTORY:
            ${conversationHistoryText}
            
            Based on the client's last message, ask the NEXT logical question to build the persona, or, if you have all 5 components, provide the final JSON dossier. Be proactive and consultative.
        `;
        
        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const botResponse = result.candidates[0].content.parts[0].text;
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
            } else {
                throw new Error("Invalid response from API");
            }

        } catch (error) {
            console.error("Error in Persona Forge:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "A communication error has occurred. Stand by." }]);
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="flex flex-col h-full bg-black text-white rounded-r-lg">
            <div className="p-6 border-b border-gray-900"><h2 className="text-2xl font-semibold flex items-center gap-3"><Hammer className="text-indigo-400"/> Persona Forge</h2><p className="text-gray-400">Forge a new identity. A weapon for the social battlefield.</p></div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg, index) => {
                         const match = msg.text.match(/```json\n([\s\S]*)\n```/);
                         if (match) {
                             try {
                                 const persona = JSON.parse(match[1]);
                                 return (
                                     <div key={index} className="p-6 border-t border-gray-900 bg-gray-900">
                                         <h3 className="text-xl font-bold text-amber-400">Persona Dossier: {persona.codename}</h3>
                                         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                             <p><strong className="block text-gray-400">Objective:</strong> {persona.objective}</p>
                                             <p><strong className="block text-gray-400">Environment:</strong> {persona.environment}</p>
                                             <p><strong className="block text-gray-400">Core Emotion:</strong> {persona.core_emotion}</p>
                                             <p><strong className="block text-gray-400">Anchor:</strong> {persona.anchor}</p>
                                         </div>
                                     </div>
                                 );
                             } catch(e) { /* Fallback for malformed JSON */ }
                         }
                         return (
                             <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                 {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div>}
                                 <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'bot' ? 'bg-gray-900 rounded-bl-none' : 'bg-indigo-600 rounded-br-none'}`}><p className="text-sm">{msg.text}</p></div>
                             </div>
                         );
                    })}
                    {isGenerating && <div className="flex items-end gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><Ghost className="w-5 h-5 text-indigo-400" /></div><div className="px-4 py-3 rounded-2xl bg-gray-900 rounded-bl-none"><div className="flex items-center space-x-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-400"></span></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 bg-black border-t border-gray-900"><div className="flex items-center bg-gray-900 rounded-lg p-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Your answer..." className="flex-grow bg-transparent focus:outline-none px-3" /><button onClick={handleSend} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 rounded-md p-2 disabled:bg-indigo-800"><Send className="w-5 h-5" /></button></div></div>
        </div>
    );
};

const TrainingGroundPage = () => {
    const [profile, setProfile] = useState('');
    const [objective, setObjective] = useState('');
    const [sessionStarted, setSessionStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [feedback, setFeedback] = useState('Awaiting your first move.');
    const [input, setInput] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const messagesEndRef = useRef(null);
    const feedbackRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [feedback]);

    const handleStartSession = () => {
        if (profile.trim() && objective.trim()) {
            setSessionStarted(true);
            setMessages([{
                id: 1,
                sender: 'sim',
                text: "The simulation has begun. I am ready."
            }]);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || isSimulating) return;

        const userMessage = { id: Date.now(), sender: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsSimulating(true);

        const managedSimMessages = manageContext(newMessages);
        const conversationHistoryText = managedSimMessages.map(msg => {
            if (msg.sender === 'user') return `User: ${msg.text}`;
            if (msg.sender === 'sim') return `Target: ${msg.text}`;
            return '';
        }).join('\n');

        // --- Get Simulation Response ---
        const simPrompt = `
            You are roleplaying as a character in a simulation.
            Your Personality Profile: ${profile}
            Your Goal in this conversation is to react according to your personality. Do not break character.
            The user's stated objective is: ${objective}
            
            CONVERSATION HISTORY:
            ${conversationHistoryText}
            
            Based on the user's last message, provide your response as the character. Be natural and stay in character.
        `;

        try {
            let chatHistory = [{ role: "user", parts: [{ text: simPrompt }] }];
            let payload = { contents: chatHistory };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this
            let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const simResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!simResponse.ok) throw new Error(`Simulation API failed: ${simResponse.status}`);
            const simResult = await simResponse.json();
            const simText = simResult.candidates?.[0]?.content?.parts?.[0]?.text || "I am not sure how to respond to that.";
            
            const allMessagesWithSim = [...newMessages, { id: Date.now() + 1, sender: 'sim', text: simText }];
            setMessages(allMessagesWithSim);

            // --- Get Advisor Feedback ---
            const managedFeedbackMessages = manageContext(allMessagesWithSim);
            const feedbackHistoryText = managedFeedbackMessages.map(m => `${m.sender === 'user' ? 'Client' : 'Target'}: ${m.text}`).join('\n');

            const feedbackPrompt = `
                You are 'The Ghost,' a master of psychological manipulation, providing real-time feedback to your client during a training simulation.
                The client's objective is: ${objective}
                The target's profile is: ${profile}

                CONVERSATION HISTORY:
                ${feedbackHistoryText}

                Analyze the client's last message. Provide a brief, cutting, and insightful critique. Focus on frame control, subtext, and psychological positioning. What did they do right? What did they do wrong? What should they do next to achieve their objective? Be direct and amoral.
            `;

            chatHistory = [{ role: "user", parts: [{ text: feedbackPrompt }] }];
            payload = { contents: chatHistory };
            const feedbackResponse = await fetch(apiUrl, {
                 method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!feedbackResponse.ok) throw new Error(`Feedback API failed: ${feedbackResponse.status}`);
            const feedbackResult = await feedbackResponse.json();
            const feedbackText = feedbackResult.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback available.";
            setFeedback(feedbackText);

        } catch (error) {
            console.error("Simulation error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 2, sender: 'sim', text: `// SIMULATION ERROR: ${error.message} //` }]);
            setFeedback("The simulation has encountered a critical error.");
        } finally {
            setIsSimulating(false);
        }
    };

    if (!sessionStarted) {
        return (
            <div className="p-8 bg-black text-white rounded-r-lg h-full overflow-y-auto">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3"><Swords className="text-green-400"/> The Training Ground</h2>
                <p className="text-gray-400 mb-8">Hone your skills against AI-driven personalities. Define the target and your objective, then engage.</p>
                <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg space-y-4">
                     <div><label className="text-gray-400 block mb-2">Target Profile:</label><textarea placeholder="Describe the target's personality, goals, and any known traits. e.g., 'A confident, slightly arrogant executive named Alex. Values status and intelligence above all. Secretly insecure about their background.'" value={profile} onChange={e => setProfile(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea></div>
                    <div><label className="text-gray-400 block mb-2">Your Objective:</label><input type="text" placeholder="e.g., 'Extract information about their upcoming project,' 'Build enough rapport to get a private meeting.'" value={objective} onChange={e => setObjective(e.target.value)} className="w-full bg-gray-800 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <button onClick={handleStartSession} disabled={!profile || !objective} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">Begin Simulation</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-black text-white rounded-r-lg">
            {/* Main Chat Pane */}
            <div className="flex flex-col flex-grow h-full">
                <div className="p-6 border-b border-gray-900">
                    <h2 className="text-2xl font-semibold">Training Simulation</h2>
                    <p className="text-gray-400 text-sm">Objective: {objective}</p>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="space-y-6">
                         {messages.map((msg) => (
                             <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                 {msg.sender === 'sim' && <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center flex-shrink-0"><Swords className="w-5 h-5 text-green-400" /></div>}
                                 <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'sim' ? 'bg-gray-900 rounded-bl-none' : 'bg-indigo-600 rounded-br-none'}`}><p className="text-sm">{msg.text}</p></div>
                             </div>
                         ))}
                         {isSimulating && <div className="flex items-end gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div></div><div className="px-4 py-3 rounded-2xl bg-gray-900 rounded-bl-none">...</div></div>}
                         <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="p-4 bg-black border-t border-gray-900">
                    <div className="flex items-center bg-gray-900 rounded-lg p-2">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Your response..." className="flex-grow bg-transparent focus:outline-none px-3" />
                        <button onClick={handleSend} disabled={isSimulating} className="bg-indigo-600 hover:bg-indigo-500 rounded-md p-2 disabled:bg-indigo-800"><Send className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
            
            {/* Advisor Feedback Sidebar */}
            <div className="w-full md:w-80 flex-shrink-0 bg-gray-900/50 border-l border-gray-800 flex flex-col h-full">
                <div className="p-4 border-b border-gray-800">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Ghost className="text-indigo-400"/> Advisor Feedback</h3>
                </div>
                <div className="flex-grow p-4 overflow-y-auto text-sm text-gray-300">
                    <p style={{whiteSpace: "pre-wrap"}}>{feedback}</p>
                    <div ref={feedbackRef}/>
                </div>
                {isSimulating && <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">ANALYZING...</div>}
            </div>
        </div>
    );
};


const MainAppLayout = () => {
    const [page, setPage] = useState('persona_forge');
    const { user, signOut } = useAuth();
    
    const renderPage = () => {
        switch (page) {
            case 'chat': return <ChatPage />;
            case 'live_fire': return <LiveFireTacticsPage />;
            case 'dossier': return <DossierPage />;
            case 'persona_forge': return <PersonaBuilderPage />;
            case 'codex': return <CodexPage />;
            case 'training_ground': return <TrainingGroundPage />;
            default: return <PersonaBuilderPage />;
        }
    };
    
    return (
        <div className="bg-black font-sans w-full h-screen flex flex-col md:flex-row antialiased">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
              .font-sans { font-family: 'Inter', sans-serif; }
            `}</style>
            
            <div className="w-full md:w-64 bg-black text-white flex-shrink-0 p-4 border-b-2 border-gray-900 md:border-b-0 md:border-r-2 md:border-gray-900 flex flex-col">
                <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-8 px-2">
                        <Skull className="h-8 w-8 text-indigo-500" />
                        <div>
                            <h1 className="font-black text-xl tracking-tighter">THE PRINCE</h1>
                            <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                        </div>
                    </div>
                    <nav className="space-y-2">
                        <NavLink page="chat" setPage={setPage} currentPage={page} Icon={Ghost}>Intelligence</NavLink>
                        <NavLink page="live_fire" setPage={setPage} currentPage={page} Icon={Crosshair}>Live Fire</NavLink>
                        <NavLink page="dossier" setPage={setPage} currentPage={page} Icon={FileText}>The Dossier</NavLink>
                        <NavLink page="persona_forge" setPage={setPage} currentPage={page} Icon={Hammer}>Persona Forge</NavLink>
                        <NavLink page="training_ground" setPage={setPage} currentPage={page} Icon={Swords}>Training Ground</NavLink>
                        <NavLink page="codex" setPage={setPage} currentPage={page} Icon={BookOpen}>The Codex</NavLink>
                    </nav>
                </div>
                 <div className="mt-auto">
                     <button onClick={signOut} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-red-900/50 hover:text-white transition-all duration-200 rounded-lg">
                         <LogOut className="h-5 w-5" />
                         <span>Logout</span>
                     </button>
                 </div>
            </div>

            <main className="flex-grow bg-black h-full">
                {renderPage()}
            </main>
        </div>
    )
}


// --- Main App Component ---

export default function App() {
    return (
        <AuthProvider>
            <AppContainer />
        </AuthProvider>
    );
}

const AppContainer = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
             <div className="bg-black text-white w-full h-screen flex items-center justify-center font-sans">
                 <div className="flex items-center space-x-1">
                     <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></span>
                     <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></span>
                     <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></span>
                 </div>
             </div>
        )
    }

    return user ? <MainAppLayout /> : <AuthPage />;
}
