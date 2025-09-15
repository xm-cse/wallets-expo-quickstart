import { createContext, useContext, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { useWallet, useCrossmint } from "@crossmint/client-sdk-react-native-ui";
import { FlowNonCustodialSigner } from "@/signers/ncs-flow-signer";
import type {
  EmailInternalSignerConfig,
  PhoneInternalSignerConfig,
} from "@/signers/types";

type FlowSignerContext = {
  signRaw: (message: string) => Promise<{ signature: string }>;
};

const FlowSignerContext = createContext<FlowSignerContext | null>(null);

interface FlowWalletProviderProps {
  children: ReactNode;
}

export function FlowWalletProvider({ children }: FlowWalletProviderProps) {
  const { crossmint } = useCrossmint();
  const { onAuthRequired, clientTEEConnection, wallet } = useWallet();

  // Store the current signer instance
  const currentSignerRef = useRef<FlowNonCustodialSigner | null>(null);

  const signRaw = useCallback(
    async (message: string): Promise<{ signature: string }> => {
      // Create signer if it doesn't exist
      if (!currentSignerRef.current) {
        if (!clientTEEConnection || !onAuthRequired || !wallet) {
          throw new Error(
            "Wallet not properly initialized. Make sure you are within CrossmintWalletProvider."
          );
        }

        // Get signer info directly from wallet
        const signerLocator = wallet.signer.locator();
        const signerType = signerLocator.startsWith("email:")
          ? "email"
          : "phone";
        const signerValue = signerLocator.split(":")[1];

        const config: EmailInternalSignerConfig | PhoneInternalSignerConfig =
          signerType === "email"
            ? {
                type: "email",
                email: signerValue,
                locator: signerLocator,
                address: wallet.address,
                crossmint,
                clientTEEConnection: clientTEEConnection(),
                onAuthRequired,
              }
            : {
                type: "phone",
                phone: signerValue,
                locator: signerLocator,
                address: wallet.address,
                crossmint,
                clientTEEConnection: clientTEEConnection(),
                onAuthRequired,
              };

        currentSignerRef.current = new FlowNonCustodialSigner(config);
      }

      return currentSignerRef.current.signRaw(message);
    },
    [crossmint, clientTEEConnection, onAuthRequired, wallet]
  );

  const contextValue = { signRaw };

  return (
    <FlowSignerContext.Provider value={contextValue}>
      {children}
    </FlowSignerContext.Provider>
  );
}

// Custom hook to use the Flow wallet signer
export function useFlowSigner() {
  const context = useContext(FlowSignerContext);
  if (!context) {
    throw new Error("useFlowSigner must be used within a FlowWalletProvider");
  }
  return context;
}
