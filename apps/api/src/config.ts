/**
 * Application configuration from environment variables.
 */
export const config = {
  /** Server port */
  port: parseInt(process.env.PORT || "3001", 10),

  /** Environment mode */
  nodeEnv: process.env.NODE_ENV || "development",

  /** SQLite database path */
  databasePath: process.env.DATABASE_PATH || "./data/mitate.db",

  /** XRPL Testnet JSON-RPC endpoint */
  xrplRpcUrl: process.env.XRPL_RPC_URL || "https://s.altnet.rippletest.net:51234",

  /** XRPL Testnet WebSocket endpoint */
  xrplWsUrl: process.env.XRPL_WS_URL || "wss://s.altnet.rippletest.net:51233",

  /** XRPL Network ID (for validation) */
  xrplNetworkId: parseInt(process.env.XRPL_NETWORK_ID || "1", 10), // 1 = Testnet

  /** Market operator address */
  operatorAddress: process.env.XRPL_OPERATOR_ADDRESS || "",

  /** Market issuer address */
  issuerAddress: process.env.XRPL_ISSUER_ADDRESS || "",

  /** Market issuer secret (for auto-minting tokens) */
  issuerSecret: process.env.XRPL_ISSUER_SECRET || "",

  /** Admin API key for privileged operations */
  adminApiKey: process.env.ADMIN_API_KEY || "",
} as const;

/**
 * Validate required configuration on startup.
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (config.nodeEnv === "production") {
    if (!config.operatorAddress) {
      errors.push("XRPL_OPERATOR_ADDRESS is required in production");
    }
    if (!config.issuerAddress) {
      errors.push("XRPL_ISSUER_ADDRESS is required in production");
    }
    if (!config.adminApiKey) {
      errors.push("ADMIN_API_KEY is required in production");
    }
  }

  return errors;
}
