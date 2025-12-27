import Tts from 'react-native-tts';

class TTSService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize TTS
            await Tts.setDefaultLanguage('en-US');
            await Tts.setDefaultRate(0.5);
            await Tts.setDefaultPitch(1.0);
            this.initialized = true;
        } catch (error) {
            console.error('TTS initialization error:', error);
            this.initialized = false;
        }
    }

    async speak(text, language = 'en-US') {
        try {
            if (!this.initialized) {
                await this.init();
            }

            if (!this.initialized) {
                console.warn('TTS not available');
                return;
            }

            // Set language
            await Tts.setDefaultLanguage(language);

            // Speak
            await Tts.speak(text);
        } catch (error) {
            console.error('TTS speak error:', error);
        }
    }

    async stop() {
        try {
            await Tts.stop();
        } catch (error) {
            console.error('TTS stop error:', error);
        }
    }

    async setRate(rate) {
        try {
            await Tts.setDefaultRate(rate);
        } catch (error) {
            console.error('TTS set rate error:', error);
        }
    }

    async setPitch(pitch) {
        try {
            await Tts.setDefaultPitch(pitch);
        } catch (error) {
            console.error('TTS set pitch error:', error);
        }
    }
}

export default new TTSService();
