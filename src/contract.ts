import artifact from '../contracts/out/TipJar.sol/TipJar.json'

export const TIPJAR_ADDRESS = '0xbdf78c9958efb9ba5bc6a5aec880e2eee718c31c' as const
export const TIPJAR_ABI = artifact.abi

export const TIPJAR_CHAIN_ID = 5042002 // Arc Testnet

// Recipient labels for display — update to match your actual recipients
export const RECIPIENT_A_LABEL = 'Creator'
export const RECIPIENT_B_LABEL = 'Team'
