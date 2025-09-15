import React, { useState, useCallback, useEffect } from "react";
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
import { useFlowSigner } from "@/providers/FlowWalletProvider";
import * as Crypto from "expo-crypto";

export default function SignMessage() {
  const { wallet } = useWallet();
  // new hook
  const { signRaw, derivePublicKey } = useFlowSigner();
  const [message, setMessage] = useState("Hello Flow");
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicKey = async () => {
      const result = await derivePublicKey();
      // eslint-disable-next-line no-console
      console.log("Public key:", result);
      setPublicKey(result.publicKey.bytes);
    };
    fetchPublicKey();
  }, [derivePublicKey]);

  const signMessage = useCallback(async () => {
    if (!wallet || !message) return;

    try {
      setLoading(true);

      // Hash the message to 32 bytes (SHA-256)
      const messageHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // eslint-disable-next-line no-console
      console.log("=== Crossmint -> Flow Test ===");
      // eslint-disable-next-line no-console
      console.log("Original message:", message);
      // eslint-disable-next-line no-console
      console.log("SHA-256 hash:", messageHash);

      // Pass the 64-character hex hash to signRaw
      const result = await signRaw(messageHash);
      const sig = result.signature.toString();

      // eslint-disable-next-line no-console
      console.log("Signature:", sig);
      // eslint-disable-next-line no-console
      console.log("Signer address:", wallet.signer.locator());

      setSignature(sig);
    } catch (error) {
      Alert.alert("Error", `${error}`);
    } finally {
      setLoading(false);
    }
  }, [wallet, message, signRaw]);

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
          {
            "• Message is SHA-256 hashed to 32 bytes\n• Signed with secp256k1 curve\n• Raw signing - no prefixes added"
          }
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

      {publicKey && (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Public key:</Text>
          <Text style={styles.signature} numberOfLines={3}>
            {publicKey}
          </Text>
        </View>
      )}

      {signature && (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Signature:</Text>
          <Text style={styles.signature} numberOfLines={3}>
            {signature}
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
