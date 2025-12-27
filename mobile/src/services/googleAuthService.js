import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

class GoogleAuthService {
    constructor() {
        this.isConfigured = false;
    }

    configure() {
        if (this.isConfigured) return;

        try {
            GoogleSignin.configure({
                // Web Client ID from Google Cloud Console
                webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
                offlineAccess: false,
            });
            this.isConfigured = true;
        } catch (error) {
            console.error('Google Sign-In configure error:', error);
        }
    }

    async signIn() {
        this.configure();

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const tokens = await GoogleSignin.getTokens();

            return {
                success: true,
                idToken: tokens.idToken,
                user: userInfo.user,
            };
        } catch (error) {
            console.error('Google Sign-In error:', error);

            let message = 'Google sign-in failed';

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                message = 'Sign-in cancelled';
            } else if (error.code === statusCodes.IN_PROGRESS) {
                message = 'Sign-in already in progress';
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                message = 'Play Services not available';
            }

            return {
                success: false,
                error: message,
            };
        }
    }

    async signOut() {
        try {
            await GoogleSignin.signOut();
            return true;
        } catch (error) {
            console.error('Google Sign-Out error:', error);
            return false;
        }
    }

    async isSignedIn() {
        try {
            return await GoogleSignin.isSignedIn();
        } catch (error) {
            return false;
        }
    }
}

export default new GoogleAuthService();
