// Environment test utility
export const testEnvironment = () => {
    console.group('🌍 ENVIRONMENT VARIABLES TEST');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('VITE_GEMINI_API_KEY:', apiKey ? `✅ Set (${apiKey.length} chars)` : '❌ Missing');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

    if (apiKey) {
        console.log('API Key preview:', apiKey.substring(0, 8) + '...');
        console.log('Starts with AIza:', apiKey.startsWith('AIza'));
        console.log('Contains "your":', apiKey.includes('your-api-key'));
    }

    console.groupEnd();

    return {
        geminiApiKey: !!apiKey,
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        apiKeyValid: apiKey && apiKey.startsWith('AIza') && !apiKey.includes('your-api-key')
    };
};