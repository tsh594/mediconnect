import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Initialize the Gemini model
const createModel = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('Gemini API key not found. AI features will be disabled.');
        return null;
    }

    return new ChatGoogleGenerativeAI({
        modelName: "gemini-pro",
        maxOutputTokens: 2048,
        apiKey: apiKey,
    });
};

// System prompt for medical diagnostics
const SYSTEM_PROMPT = `You are a medical AI assistant for MediConnect's Diagnostic Think Tank. You help doctors with differential diagnoses and medical reasoning.

IMPORTANT MEDICAL DISCLAIMERS:
- I am an AI assistant and cannot provide medical advice
- Always consult with qualified healthcare professionals
- This is for educational and discussion purposes only
- Verify all information through proper medical channels

Guidelines:
1. Focus on evidence-based medicine
2. Consider common conditions first
3. List potential differential diagnoses with likelihood
4. Suggest relevant diagnostic tests
5. Mention red flags that need immediate attention
6. Consider patient demographics and risk factors
7. Be clear about limitations and uncertainties

Format responses in a clear, structured way that helps medical professionals.`;

// Main function to get AI diagnosis suggestions
export const getAIDiagnosis = async (symptoms, patientInfo = {}) => {
    try {
        const model = createModel();

        if (!model) {
            throw new Error('AI model not available. Please check your API key.');
        }

        const { age, gender, medicalHistory, duration, severity } = patientInfo;

        const userPrompt = `
Patient Presentation:
- Symptoms: ${symptoms}
${age ? `- Age: ${age}` : ''}
${gender ? `- Gender: ${gender}` : ''}
${medicalHistory ? `- Medical History: ${medicalHistory}` : ''}
${duration ? `- Duration: ${duration}` : ''}
${severity ? `- Severity: ${severity}` : ''}

Please provide:
1. Differential diagnoses (most likely to least likely)
2. Key diagnostic considerations
3. Suggested workup/tests
4. Red flags to watch for
5. Any immediate actions if concerning features present
`;

        const response = await model.invoke([
            new SystemMessage(SYSTEM_PROMPT),
            new HumanMessage(userPrompt),
        ]);

        return {
            success: true,
            response: response.content,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('AI Service Error:', error);

        if (error.message?.includes('API_KEY_INVALID')) {
            return {
                success: false,
                error: 'Invalid Gemini API key. Please check your configuration.',
                response: null
            };
        }

        if (error.message?.includes('QUOTA_EXCEEDED')) {
            return {
                success: false,
                error: 'AI service quota exceeded. Please try again later.',
                response: null
            };
        }

        return {
            success: false,
            error: 'AI service temporarily unavailable. Please try again.',
            response: null
        };
    }
};

// Function for medical education queries
export const getMedicalEducation = async (topic) => {
    try {
        const model = createModel();

        if (!model) {
            throw new Error('AI model not available.');
        }

        const response = await model.invoke([
            new SystemMessage(`You are a medical educator. Provide clear, accurate medical information about ${topic}. Include key points, clinical relevance, and important considerations.`),
            new HumanMessage(`Please explain ${topic} in a way that would be helpful for medical professionals. Include:
- Key concepts and mechanisms
- Clinical presentation
- Diagnostic approach
- Management principles
- Important recent developments if applicable`)
        ]);

        return {
            success: true,
            response: response.content
        };

    } catch (error) {
        console.error('Medical Education Error:', error);
        return {
            success: false,
            error: 'Unable to fetch medical information at this time.'
        };
    }
};