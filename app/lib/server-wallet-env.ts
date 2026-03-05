type NetworkType = 'testnet' | 'mainnet';

export type WalletEnvSelection = {
  source: string | null;
};

/**
 * Optionally map network-specific env vars into the SDK's canonical key env.
 *
 * SDK seeding reads MONEY_FAST_PRIVATE_KEY. This helper allows deploys to
 * provide distinct per-network secrets and applies the right one per request.
 */
export function applyServerWalletEnv(chain: string, network: NetworkType): WalletEnvSelection {
  if (chain !== 'fast') {
    return { source: null };
  }

  const scopedName = network === 'mainnet'
    ? 'MONEY_FAST_MAINNET_PRIVATE_KEY'
    : 'MONEY_FAST_TESTNET_PRIVATE_KEY';
  const scopedValue = process.env[scopedName]?.trim();
  if (scopedValue) {
    process.env.MONEY_FAST_PRIVATE_KEY = scopedValue;
    return { source: scopedName };
  }

  if (process.env.MONEY_FAST_PRIVATE_KEY?.trim()) {
    return { source: 'MONEY_FAST_PRIVATE_KEY' };
  }

  return { source: null };
}
