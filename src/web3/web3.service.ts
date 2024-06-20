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
import { base, baseSepolia } from 'viem/chains';
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
    const isMainnet = this.configService.get<string>('MAINNET');
    let provider: string = this.configService.get<string>('BASE_SEPOLIA_URL');
    let chainConfig: any = baseSepolia;
    if (isMainnet == 'true') {
      provider = this.configService.get<string>('BASE_URL');
      chainConfig = base;
    }
    this.walletClient = createWalletClient({
      account,
      chain: chainConfig as Chain,
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
      }
      return success;
    } catch (err) {
      return success;
    }
  }
}
