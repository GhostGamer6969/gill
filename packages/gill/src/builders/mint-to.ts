import type { Address, Instruction, TransactionSigner } from "@solana/kit";
import { getAssociatedTokenAccountAddress, TOKEN_2022_PROGRAM_ADDRESS } from "../programs";
import { getMintTokensInstructions } from "../programs/token/instructions/mint-tokens";

type MintToArgs = {
  mint: Address;
  toOwner: TransactionSigner;
  amount: bigint | number;
};

export async function mintTo({
  mint,
  toOwner,
  amount,
}: MintToArgs): Promise<Instruction[]> {
  const ata = await getAssociatedTokenAccountAddress(mint, toOwner, TOKEN_2022_PROGRAM_ADDRESS);

  return getMintTokensInstructions({
    mint,
    feePayer: toOwner,          
    mintAuthority: toOwner,
    destination: toOwner,
    ata,
    amount,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });
}
