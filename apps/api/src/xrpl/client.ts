import { Client, Wallet, type ServerInfoResponse, type SubmittableTransaction } from "xrpl";
import { config } from "../config";

let wsClient: Client | null = null;

export interface XrplHealth {
  connected: boolean;
  networkId?: number;
  ledgerIndex?: number;
  serverState?: string;
  error?: string;
}

/**
 * Create and connect the XRPL WebSocket client.
 */
export async function createXrplClient(): Promise<Client> {
  if (wsClient?.isConnected()) {
    return wsClient;
  }

  wsClient = new Client(config.xrplWsUrl);

  wsClient.on("error", (error) => {
    console.error("XRPL client error:", error);
  });

  wsClient.on("disconnected", (code) => {
    console.warn(`XRPL client disconnected with code ${code}`);
  });

  wsClient.on("connected", () => {
    console.log("XRPL client connected");
  });

  await wsClient.connect();
  return wsClient;
}

/**
 * Get the current XRPL WebSocket client.
 * Returns null if not connected.
 */
export function getXrplClient(): Client | null {
  return wsClient?.isConnected() ? wsClient : null;
}

/**
 * Close the XRPL WebSocket client.
 */
export async function closeXrplClient(): Promise<void> {
  if (wsClient) {
    await wsClient.disconnect();
    wsClient = null;
  }
}

/**
 * Get the health status of the XRPL connection.
 */
export async function getXrplHealth(): Promise<XrplHealth> {
  if (!wsClient || !wsClient.isConnected()) {
    return {
      connected: false,
      error: "Client not connected",
    };
  }

  try {
    const response = (await wsClient.request({
      command: "server_info",
    })) as ServerInfoResponse;

    const info = response.result.info;

    return {
      connected: true,
      networkId: info.network_id,
      ledgerIndex: info.validated_ledger?.seq,
      serverState: info.server_state,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Make a JSON-RPC request to XRPL.
 * Used for one-off requests when WebSocket isn't needed.
 */
export async function xrplRpcRequest<T>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(config.xrplRpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method,
      params: [params],
    }),
  });

  if (!response.ok) {
    throw new Error(`XRPL RPC error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    result: T & { error?: string; error_message?: string };
  };

  if (data.result?.error) {
    throw new Error(`XRPL error: ${data.result.error_message || data.result.error}`);
  }

  return data.result as T;
}

/**
 * Get account info via JSON-RPC.
 */
export async function getAccountInfo(address: string) {
  return xrplRpcRequest<{
    account_data: {
      Account: string;
      Balance: string;
      Sequence: number;
    };
    ledger_current_index: number;
  }>("account_info", {
    account: address,
    ledger_index: "current",
  });
}

/**
 * Get current ledger info via JSON-RPC.
 */
export async function getLedgerInfo() {
  return xrplRpcRequest<{
    ledger: {
      ledger_index: number;
      ledger_hash: string;
      close_time: number;
    };
  }>("ledger", {
    ledger_index: "validated",
  });
}

/**
 * Get transaction details via JSON-RPC.
 * Returns the transaction with its Sequence number.
 */
export async function getTransaction(txHash: string) {
  return xrplRpcRequest<{
    Account: string;
    Sequence: number;
    TransactionType: string;
    hash: string;
    validated: boolean;
    meta?: {
      TransactionResult: string;
    };
  }>("tx", {
    transaction: txHash,
    binary: false,
  });
}

/**
 * Sign and submit a transaction using the issuer wallet.
 * Used for server-side token minting.
 */
export async function signAndSubmitWithIssuer(
  tx: SubmittableTransaction
): Promise<{ hash: string; result: string }> {
  if (!config.issuerSecret) {
    throw new Error("XRPL_ISSUER_SECRET not configured");
  }

  const client = await createXrplClient();
  const wallet = Wallet.fromSeed(config.issuerSecret);

  // Autofill transaction fields (Fee, Sequence, etc.)
  const prepared = await client.autofill(tx);

  // Sign the transaction
  const signed = wallet.sign(prepared);

  // Submit and wait for validation
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = (result.result.meta as { TransactionResult?: string })?.TransactionResult;
  
  if (txResult !== "tesSUCCESS") {
    throw new Error(`Transaction failed: ${txResult}`);
  }

  return {
    hash: result.result.hash,
    result: txResult,
  };
}

/**
 * Sign and submit a transaction using the operator wallet.
 * Used for server-side payouts.
 */
export async function signAndSubmitWithOperator(
  tx: SubmittableTransaction
): Promise<{ hash: string; result: string }> {
  if (!config.operatorSecret) {
    throw new Error("XRPL_OPERATOR_SECRET not configured");
  }

  const client = await createXrplClient();
  const wallet = Wallet.fromSeed(config.operatorSecret);

  // Autofill transaction fields (Fee, Sequence, etc.)
  const prepared = await client.autofill(tx);

  // Sign the transaction
  const signed = wallet.sign(prepared);

  // Submit and wait for validation
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = (result.result.meta as { TransactionResult?: string })?.TransactionResult;
  
  if (txResult !== "tesSUCCESS") {
    throw new Error(`Transaction failed: ${txResult}`);
  }

  return {
    hash: result.result.hash,
    result: txResult,
  };
}
