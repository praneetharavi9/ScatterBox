import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      console.log('Signed in:', data.user);
    }
  }

  async function handleSignUp() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      console.log('Signed up:', data.user);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>ScatterBox</Text>
          <Text style={styles.tagline}>organize the chaos</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              (pressed || loading) && { opacity: 0.75 },
            ]}>
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Please wait…' : 'Sign In'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              (pressed || loading) && { opacity: 0.75 },
            ]}>
            <Text style={styles.btnSecondaryText}>Sign Up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#F5F0E8',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7280',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#1A1A1B',
    borderWidth: 1,
    borderColor: '#2D2D2F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F5F0E8',
  },
  error: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: '#FB923C',
  },
  btnPrimaryText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  btnSecondaryText: {
    color: '#FB923C',
    fontSize: 16,
    fontWeight: '600',
  },
});
