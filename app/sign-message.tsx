import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useWallet } from "@crossmint/client-sdk-react-native-ui";

export default function SignMessage() {
  const { wallet } = useWallet();
  const [message, setMessage] = useState("Hello Flow");
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signMessage = useCallback(async () => {
    if (!wallet || !message) return;

    try {
      setLoading(true);

      // sign message: returns 65-byte Ethereum signature
      const result = await wallet.signer.signMessage(message);
      const sig = result.signature.toString();

      // for flow cadence: remove last byte (v) to get 64 bytes
      const cadenceSig = sig.slice(0, -2);

      console.log("=== Crossmint -> Flow Test ===");
      console.log("Message:", message);
      console.log("Signature (65 bytes):", sig);
      console.log("Cadence format (64 bytes):", cadenceSig);
      console.log("Signer address:", wallet.signer.locator());

      setSignature(sig);
    } catch (error) {
      Alert.alert("Error", `${error}`);
    } finally {
      setLoading(false);
    }
  }, [wallet, message]);

  if (!wallet) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Flow Signature Test</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {`• We sign with Ethereum format (65 bytes)\n• Uses Keccak256 + secp256k1\n• Adds prefix: "\x19Ethereum Signed Message:"`}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter message"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={signMessage}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Message</Text>
        )}
      </TouchableOpacity>

      {signature && (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Signature:</Text>
          <Text style={styles.signature} numberOfLines={3}>
            {signature}
          </Text>

          <Text style={styles.label}>For Cadence (remove last byte):</Text>
          <Text style={styles.signature} numberOfLines={3}>
            {signature.slice(0, -2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#05b959",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  resultBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  signature: {
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 12,
  },
});
