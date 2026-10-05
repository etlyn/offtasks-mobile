import React, {useState} from 'react';
import {Modal, View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {supabaseClient} from '../lib/supabase';
export function RecoveryPasswordModal({visible, onComplete}: {visible: boolean; onComplete: () => void}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const finish = async () => {
    setBusy(true); setError('');
    try {
      const client = supabaseClient;
      if (!client) throw new Error('Account recovery is unavailable.');
      const {error: failure} = await client.auth.updateUser({password});
      if (failure) throw new Error('This recovery link has expired. Request a new link and try again.');
      await client.auth.signOut({scope: 'local'});
      setPassword(''); setConfirmation(''); onComplete();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update password.'); }
    finally { setBusy(false); }
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={() => {if (!busy) onComplete();}}>
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a new password</Text>
      <TextInput accessibilityLabel="New password" placeholder="New password" secureTextEntry
        autoCapitalize="none" textContentType="newPassword" value={password} onChangeText={setPassword}
        editable={!busy} style={styles.input} />
      <TextInput accessibilityLabel="Confirm password" placeholder="Confirm password" secureTextEntry
        autoCapitalize="none" value={confirmation} onChangeText={setConfirmation} editable={!busy} style={styles.input} />
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      <Button title={busy ? 'Saving...' : 'Save password'} onPress={() => void finish()}
        disabled={busy || password.length < 10 || password !== confirmation} />
      <Button title="Cancel" disabled={busy} onPress={() => onComplete()} />
    </View>
  </Modal>;
}
const styles = StyleSheet.create({container: {flex: 1, justifyContent: 'center', padding: 24, gap: 18},
  heading: {fontSize: 20, fontWeight: '600'}, input: {minHeight: 48, borderBottomWidth: 1, padding: 12}});
