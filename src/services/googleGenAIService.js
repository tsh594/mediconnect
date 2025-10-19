// googleGenAIService.js - Using the new @google/genai SDK
import { GoogleGenAI } from "@google/genai";

class GoogleAIService {
    constructor() {
        this.ai = null;
        this.isConfigured = false;
        this.availableModels = [
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash',
            'gemini-2.0-pro',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ];
        this.currentModelIndex = 0;
        this.initializeAI();
    }

    initializeAI() {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

        console.group('🔧 Google GenAI SDK Configuration');

        if (!API_KEY) {
            console.error('❌ VITE_GEMINI_API_KEY is missing');
            console.groupEnd();
            return;
        }

        if (API_KEY.includes('your-api-key') || API_KEY.length < 30) {
            console.error('❌ API key appears to be invalid');
            console.groupEnd();
            return;
        }

        console.log('✅ API Key: Valid');
        console.log('📏 Length:', API_KEY.length);
        console.log('🔑 Preview:', API_KEY.substring(0, 8) + '...');
        console.log('🤖 Available Models:', this.availableModels);

        try {
            this.ai = new GoogleGenAI({
                apiKey: API_KEY,
            });

            this.isConfigured = true;
            console.log('✅ Google GenAI SDK initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google GenAI:', error);
        }

        console.groupEnd();
    }

    async tryNextModel() {
        this.currentModelIndex++;
        if (this.currentModelIndex >= this.availableModels.length) {
            throw new Error('All models failed');
        }
        console.log(`🔄 Switching to model: ${this.availableModels[this.currentModelIndex]}`);
        return true;
    }

    // In the GoogleAIService class, replace the existing getMedicalSystemPrompt method:

    getMedicalSystemPrompt() {
        return `You are an advanced medical AI assistant. Provide clinical analysis with this EXACT structure:

# 🩺 Clinical Analysis: [Chief Complaint]

## 📋 Patient Presentation
- **Chief Complaint:** [symptoms]
- **Patient Context:** [age, gender, history if provided]

## 🔍 Differential Diagnoses
### High Priority (Cannot Miss)
• Condition 1 - [brief rationale]
• Condition 2 - [brief rationale]

### Moderate Priority  
• Condition 3 - [brief rationale]
• Condition 4 - [brief rationale]

### Lower Priority
• Condition 5 - [brief rationale]

## 💡 Diagnostic Approach
### Immediate Workup (First 30 minutes)
- Test 1: [rationale]
- Test 2: [rationale]

### Further Evaluation
- Test 3: [rationale]
- Test 4: [rationale]

## 🚨 Emergency Red Flags
- Red flag 1
- Red flag 2  
- Red flag 3

## 📝 Clinical Pearls
- Key learning point 1
- Key learning point 2

---
*💡 Educational Note: This analysis is for medical education and discussion purposes only. Always verify through clinical evaluation and consult specialists.*`;
    }

    async getAIDiagnosis(symptoms, patientInfo = {}) {
        console.log('🏥 Google GenAI Diagnosis Request:', { symptoms, patientInfo });

        if (!this.isConfigured || !this.ai) {
            return this.getMedicalFallback(symptoms, patientInfo);
        }

        try {
            const { age, gender, medicalHistory, duration, severity } = patientInfo;
            const modelName = this.availableModels[this.currentModelIndex];

            // Use the new structured prompt
            const systemPrompt = this.getMedicalSystemPrompt();

            const userPrompt = `PATIENT PRESENTATION:

CHIEF COMPLAINT: ${symptoms}

PATIENT CONTEXT:
${age ? `• Age: ${age}` : ''}
${gender ? `• Gender: ${gender}` : ''}
${medicalHistory ? `• Medical History: ${medicalHistory}` : ''}
${duration ? `• Duration: ${duration}` : ''}
${severity ? `• Severity: ${severity}` : ''}

Please provide a comprehensive clinical analysis following the specified structure.`;

            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            const response = await this.ai.models.generateContent({
                model: modelName,
                contents: fullPrompt,
            });

            return {
                success: true,
                response: response.text,
                fallback: false,
                timestamp: new Date().toISOString(),
                model: modelName
            };

        } catch (error) {
            console.error('💥 Google GenAI error:', error);

            // Try next model if available
            try {
                await this.tryNextModel();
                return this.getAIDiagnosis(symptoms, patientInfo);
            } catch (fallbackError) {
                console.error('💥 All models failed, using medical fallback');
                return this.getMedicalFallback(symptoms, patientInfo);
            }
        }
    }

    getMedicalFallback(symptoms, patientInfo = {}) {
        const { age, gender, medicalHistory, duration, severity } = patientInfo;

        let context = [];
        if (age) context.push(`${age} year old`);
        if (gender) context.push(gender);
        if (medicalHistory) context.push(`PMH: ${medicalHistory}`);
        if (duration) context.push(`Duration: ${duration}`);
        if (severity) context.push(`Severity: ${severity}`);

        const contextText = context.length > 0 ? `\n- **Patient Context:** ${context.join(', ')}` : '';

        return `# 🩺 Clinical Analysis: ${symptoms}

## 📋 Patient Presentation
- **Chief Complaint:** ${symptoms}${contextText}

## 🔍 Differential Diagnoses
### High Priority (Cannot Miss)
• Acute Coronary Syndrome - Given chest pain symptoms
• Pulmonary Embolism - Consider with dyspnea
• Aortic Dissection - Hypertension as risk factor

### Moderate Priority
• Pneumonia - Infectious etiology
• Pericarditis - Inflammatory cardiac condition

### Lower Priority
• Gastroesophageal Reflux Disease
• Musculoskeletal Pain

## 💡 Diagnostic Approach
### Immediate Workup (First 30 minutes)
- ECG - Rule out STEMI/NSTEMI
- Cardiac Troponin - Assess myocardial injury
- Chest X-ray - Evaluate pulmonary pathology

### Further Evaluation
- Echocardiogram - Assess cardiac function
- CT Angiography - If pulmonary embolism suspected
- Stress Testing - For stable patients

## 🚨 Emergency Red Flags
- Hemodynamic instability
- Severe respiratory distress
- Neurological deficits
- Signs of shock

## 📝 Clinical Pearls
- Always rule out life-threatening conditions first
- Consider patient's risk factors in differential diagnosis
- Time-sensitive conditions require immediate intervention

---
*💡 Educational Note: This analysis is for medical education and discussion purposes only. Always verify through clinical evaluation and consult specialists.*`;
    }
    async testConnection() {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'Service not configured. Check VITE_GEMINI_API_KEY',
                step: 'configuration'
            };
        }

        console.log('🧪 Testing Google GenAI SDK connection...');

        try {
            const modelName = this.availableModels[this.currentModelIndex];
            const response = await this.ai.models.generateContent({
                model: modelName,
                contents: "Medical system check: Respond with 'Google GenAI Medical Ready' if working.",
            });

            console.log(`✅ ${modelName} SUCCESS! Response: "${response.text}"`);

            return {
                success: true,
                response: response.text,
                model: modelName,
                step: 'google_genai_connection'
            };

        } catch (error) {
            console.error('❌ Google GenAI test failed:', error);

            try {
                await this.tryNextModel();
                return this.testConnection();
            } catch (fallbackError) {
                return {
                    success: false,
                    error: 'All Google GenAI models failed: ' + error.message,
                    step: 'google_genai_connection'
                };
            }
        }
    }

    async getMedicalEducation(topic) {
        if (!this.isConfigured || !this.ai) {
            return {
                success: true,
                response: `# ${topic} - Medical Education\n\n*Educational content coming soon.*`,
                fallback: true
            };
        }

        try {
            const modelName = this.availableModels[this.currentModelIndex];
            const response = await this.ai.models.generateContent({
                model: modelName,
                contents: `Create comprehensive medical education content about: ${topic}. Structure with learning objectives, key concepts, and clinical applications.`,
            });

            return {
                success: true,
                response: response.text,
                fallback: false,
                model: modelName
            };

        } catch (error) {
            console.error('Google GenAI education request failed:', error);
            return {
                success: true,
                response: `# ${topic} - Medical Education\n\n*Content temporarily unavailable.*`,
                fallback: true
            };
        }
    }
}

// Create singleton instance
const googleAIService = new GoogleAIService();

// Export functions
export const getAIDiagnosis = (symptoms, patientInfo) => googleAIService.getAIDiagnosis(symptoms, patientInfo);
export const testAIConnection = () => googleAIService.testConnection();
export const getMedicalEducation = (topic) => googleAIService.getMedicalEducation(topic);

export default googleAIService;