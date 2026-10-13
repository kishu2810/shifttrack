import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { hasErrors, validateLogin, type FieldErrors } from '@/utils/validation';

type LoginField = 'email' | 'password';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (submitting.current) return;
    const credentials = { email: email.trim(), password };
    const errors = validateLogin(credentials);
    setFieldErrors(errors);
    setFormError(null);
    if (hasErrors(errors)) return;

    submitting.current = true;
    setIsSubmitting(true);
    try {
      await login(credentials);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand} accessibilityRole="header">
              ShiftTrack
            </Text>
            <Text style={styles.subtitle}>Sign in to track your shifts.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
              placeholder="you@company.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordInput.current?.focus()}
              editable={!isSubmitting}
            />
            <Input
              ref={passwordInput}
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              placeholder="Password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
            />

            {formError ? (
              <View style={styles.formError} accessibilityRole="alert">
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <Button title="Sign In" onPress={handleSubmit} loading={isSubmitting} style={styles.submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 },
  header: { gap: 6 },
  brand: { fontSize: 34, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 17, color: colors.textSecondary },
  form: { gap: 16 },
  formError: { backgroundColor: colors.dangerMuted, borderRadius: 12, padding: 12 },
  formErrorText: { fontSize: 15, color: colors.danger },
  submit: { marginTop: 8 },
});
