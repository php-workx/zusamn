import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { PrimaryButton, Screen, Text, YStack } from '@zusamn/ui';
import { useAuthContext } from '../../src/providers';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// OAuth client IDs - must be configured via environment variables
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const GOOGLE_CLIENT_ID_IOS = getRequiredEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS');
const GOOGLE_CLIENT_ID_ANDROID = getRequiredEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID');
const GOOGLE_CLIENT_ID_WEB = getRequiredEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB');

/**
 * Generate a cryptographically secure random nonce for Apple Sign-In.
 * Required for Firebase authentication with Apple.
 */
async function generateNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const nonce = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  return { nonce, hashedNonce };
}

/**
 * Login screen with Google and Apple sign-in options.
 * Follows FR-AUTH-001 and FR-AUTH-002 requirements.
 */
export default function LoginScreen() {
  const { isLoading, error, signInWithGoogle, signInWithApple } = useAuthContext();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    webClientId: GOOGLE_CLIENT_ID_WEB,
  });

  // Handle Google OAuth response
  useEffect(() => {
    async function handleGoogleResponse() {
      if (googleResponse?.type === 'success') {
        const { id_token: idToken } = googleResponse.params;
        if (idToken) {
          setIsSigningIn(true);
          setLocalError(null);
          try {
            await signInWithGoogle(idToken);
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Google sign in failed');
          } finally {
            setIsSigningIn(false);
          }
        }
      } else if (googleResponse?.type === 'error') {
        setLocalError('Google sign in was cancelled or failed');
      }
    }
    handleGoogleResponse();
  }, [googleResponse, signInWithGoogle]);

  // Note: Redirects are handled by AuthGuard in _layout.tsx

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    await googlePromptAsync();
  };

  const handleAppleSignIn = async () => {
    setLocalError(null);
    setIsSigningIn(true);
    try {
      const { nonce, hashedNonce } = await generateNonce();
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential.identityToken) {
        await signInWithApple(credential.identityToken, nonce);
      } else {
        setLocalError('Apple sign in did not return a token');
      }
    } catch (err) {
      if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        // User cancelled, not an error
        return;
      }
      setLocalError(err instanceof Error ? err.message : 'Apple sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const displayError = localError || error?.message;
  const isButtonDisabled = isLoading || isSigningIn;

  return (
    <Screen>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <YStack alignItems="center" marginBottom="$6">
          <Text fontSize="$4" fontWeight="$2" color="$text">
            Zusamn
          </Text>
          <Text fontSize="$1" color="$textMuted" marginTop="$2">
            Shared shopping lists, ready to sync.
          </Text>
        </YStack>

        <YStack width="100%" maxWidth={300} gap="$3">
          <PrimaryButton
            onPress={handleGoogleSignIn}
            disabled={isButtonDisabled || !googleRequest}
            loading={isSigningIn}
            accessibilityLabel="Sign in with Google"
          >
            Continue with Google
          </PrimaryButton>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={{ width: '100%', height: 44 }}
              onPress={handleAppleSignIn}
            />
          )}
        </YStack>

        {displayError && (
          <Text
            fontSize="$1"
            color="$danger"
            textAlign="center"
            marginTop="$4"
            accessible
            accessibilityRole="alert"
          >
            {displayError}
          </Text>
        )}
      </YStack>
    </Screen>
  );
}
