import type { Instruction, TransactionSigner } from "@solana/kit";

import { getCreateAssociatedTokenIdempotentInstruction, getMintToInstruction } from "@solana-program/token-2022";
import { checkedAddress, checkedTransactionSigner } from "../core";
import { checkedTokenProgramAddress, getAssociatedTokenAccountAddress } from "../programs/token/addresses";
import type { TokenInstructionBase } from "../programs/token/instructions/types";

export type GetMintTokensInstructionsArgs = TokenInstructionBase & {
  /**
   * The Owner address capable of authorizing minting of new tokens.
   *
   * - this should normally by a `TransactionSigner`
   * - only for multi-sig authorities (like Squads Protocol), should you supply an `Address`
   * */
  /** Wallet address to receive the tokens being minted, via their associated token account (ata) */
  toOwner: TransactionSigner ;

  /** Amount of tokens to mint to the `owner` via their `ata` */
  amount: bigint | number;
};

/**
 * Create the instructions required to mint tokens to any wallet/owner,
 * including creating their ATA if it does not exist
 *
 * @example
 *
 * ```
 * const mint = await generateKeyPairSigner();
 * const destination = await generateKeyPairSigner();
 *
 * const instructions = mintTo({
 *   mint,
 *   toOwner: signer,
 *   amount: 1000, // note: be sure to consider the mint's `decimals` value
 *   // if decimals=2 => this will mint 10.00 tokens
 *   // if decimals=4 => this will mint 0.100 tokens
 *   // tokenProgram: TOKEN_PROGRAM_ADDRESS, // default
 *   // tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
 * });
 * ```
 */
export async function getMintTokensInstructions(args: GetMintTokensInstructionsArgs): Promise<Instruction[]> {
  args.tokenProgram = checkedTokenProgramAddress(args.tokenProgram);
  args.feePayer = checkedTransactionSigner(args.feePayer);
  args.mint = checkedAddress(args.mint);

  return [
    // create idempotent will gracefully fail if the ata already exists. this is the gold standard!
    getCreateAssociatedTokenIdempotentInstruction({
      owner: checkedAddress(args.toOwner),
      mint: args.mint,
      ata: await getAssociatedTokenAccountAddress(args.mint, args.toOwner, args.tokenProgram),
      payer: args.feePayer,
      tokenProgram: args.tokenProgram,
    }),
    getMintToInstruction(
      {
        mint: args.mint,
        mintAuthority: args.toOwner,
        token: await getAssociatedTokenAccountAddress(args.mint, args.toOwner, args.tokenProgram),
        amount: args.amount,
      },
      {
        programAddress: args.tokenProgram,
      },
    ),
  ];
}
