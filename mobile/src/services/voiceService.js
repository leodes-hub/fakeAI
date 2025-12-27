import Voice from '@react-native-voice/voice';

class VoiceService {
    constructor() {
        this.isListening = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.isAvailable = false;

        // Check if Voice module is available
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            // Check if Voice module exists and has required methods
            if (Voice && typeof Voice.isAvailable === 'function') {
                this.isAvailable = await Voice.isAvailable();
                if (this.isAvailable) {
                    // Set up event listeners only if available
                    Voice.onSpeechResults = this.onSpeechResults.bind(this);
                    Voice.onSpeechError = this.onSpeechError.bind(this);
                    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
                }
            } else {
                console.warn('Voice module not properly linked');
                this.isAvailable = false;
            }
        } catch (error) {
            console.warn('Voice recognition not available:', error);
            this.isAvailable = false;
        }
    }

    onSpeechResults(event) {
        if (event.value && event.value.length > 0) {
            const text = event.value[0];
            if (this.onResultCallback) {
                this.onResultCallback(text);
            }
        }
    }

    onSpeechError(event) {
        console.error('Speech recognition error:', event.error);
        if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
        }
        this.isListening = false;
    }

    onSpeechEnd() {
        this.isListening = false;
    }

    async startListening(language = 'en-US', onResult, onError) {
        // Check if voice is available
        if (!this.isAvailable) {
            if (onError) {
                onError('Voice recognition is not available on this device. Please type your message instead.');
            }
            return false;
        }

        try {
            this.onResultCallback = onResult;
            this.onErrorCallback = onError;

            await Voice.start(language);
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            if (onError) {
                onError(error.message || 'Failed to start voice recognition');
            }
            return false;
        }
    }

    async stopListening() {
        if (!this.isAvailable) return;

        try {
            await Voice.stop();
            this.isListening = false;
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }

    async destroy() {
        if (!this.isAvailable) return;

        try {
            await Voice.destroy();
            this.isListening = false;
            this.onResultCallback = null;
            this.onErrorCallback = null;
        } catch (error) {
            console.error('Error destroying voice recognition:', error);
        }
    }

    getIsListening() {
        return this.isListening;
    }

    getIsAvailable() {
        return this.isAvailable;
    }
}

export default new VoiceService();
