import Tts from 'react-native-tts';

class TTSService {
    constructor() {
        this.initialized = false;
        this.isSpeaking = false;
        this.onStartCallback = null;
        this.onFinishCallback = null;
        this.onCancelCallback = null;
        this.init();
    }

    async init() {
        try {
            // Initialize TTS
            await Tts.setDefaultLanguage('en-US');
            await Tts.setDefaultRate(0.5);
            await Tts.setDefaultPitch(1.0);

            // Set up event listeners
            Tts.addEventListener('tts-start', () => {
                this.isSpeaking = true;
                if (this.onStartCallback) {
                    this.onStartCallback();
                }
            });

            Tts.addEventListener('tts-finish', () => {
                this.isSpeaking = false;
                if (this.onFinishCallback) {
                    this.onFinishCallback();
                }
            });

            Tts.addEventListener('tts-cancel', () => {
                this.isSpeaking = false;
                if (this.onCancelCallback) {
                    this.onCancelCallback();
                }
            });

            this.initialized = true;
        } catch (error) {
            console.error('TTS initialization error:', error);
            this.initialized = false;
        }
    }

    // Set callbacks for speaking state changes
    setCallbacks(onStart, onFinish, onCancel) {
        this.onStartCallback = onStart;
        this.onFinishCallback = onFinish;
        this.onCancelCallback = onCancel || onFinish;
    }

    async speak(text, language = 'en-US') {
        try {
            if (!this.initialized) {
                await this.init();
            }

            if (!this.initialized) {
                console.warn('TTS not available');
                return false;
            }

            // Set language
            await Tts.setDefaultLanguage(language);

            // Speak
            await Tts.speak(text);
            return true;
        } catch (error) {
            console.error('TTS speak error:', error);
            return false;
        }
    }

    async stop() {
        try {
            await Tts.stop();
            this.isSpeaking = false;
            return true;
        } catch (error) {
            console.error('TTS stop error:', error);
            return false;
        }
    }

    getIsSpeaking() {
        return this.isSpeaking;
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
