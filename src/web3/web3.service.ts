import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createWalletClient,
  http,
  Hex,
  PrivateKeyAccount,
  Address,
  Chain,
  publicActions,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { lootABI } from './abis/nft.abi';
import { Web3Error } from './web3.error';

@Injectable()
export class Web3Service {
  private walletClient;

  constructor(private configService: ConfigService) {
    const account: PrivateKeyAccount = privateKeyToAccount(
      this.configService.get<Hex>('PRIVATE_KEY'),
    );
    const provider = this.configService.get<string>('BASE_SEPOLIA_URL');
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia as Chain,
      transport: http(provider),
    }).extend(publicActions);
  }

  async mintNFT(receiver: string, tokenUri: string): Promise<boolean> {
    const contractAddress: Address =
      this.configService.get<Address>('NFT_CONTRACT');
    const mintArgs = [receiver, tokenUri];
    let success: boolean = false;
    try {
      const { request } = await this.walletClient.simulateContract({
        address: contractAddress,
        account: this.walletClient.account,
        abi: lootABI,
        functionName: 'safeMint',
        args: mintArgs,
      });
      const hash = await this.walletClient.writeContract(request);
      const txReceipt = await this.walletClient.waitForTransactionReceipt({
        hash,
      });
      if (txReceipt?.status == 'success') {
        success = true;
      } else {
        throw new Web3Error(
          Web3Error.TRANSACTION_FAILED,
          `The transaction failed with hash ${hash}`,
        );
      }
    } catch (err) {
      throw new Web3Error(Web3Error.SERVER_CODES.INTERNAL_SERVER_ERROR, err);
    }

    return success;
  }
}
