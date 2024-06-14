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
  constructor(private configService: ConfigService) {
    const account: PrivateKeyAccount = privateKeyToAccount(
      configService.get<Hex>('PRIVATE_KEY'),
    );
    const provider = configService.get<string>('BASE_SEPOLIA_URL');
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia as Chain,
      transport: http(provider),
    }).extend(publicActions);
  }

  private walletClient;

  async mintNFT(
    receiver: string,
    lootName: string,
    eventName: string,
  ): Promise<boolean> {
    const uri: string = this.configService
      .get<string>('DOS_CDN')
      .concat('/', eventName, '/', lootName, '.json');
    const contractAddress: Address =
      this.configService.get<Address>('NFT_CONTRACT');
    const mintArgs = [receiver, uri];
    const wallet = this.walletClient;
    let success = false;
    try {
      const { request } = await wallet.simulateContract({
        address: contractAddress,
        account: wallet.account,
        abi: lootABI,
        functionName: 'safeMint',
        args: mintArgs,
      });
      const hash = await wallet.writeContract(request);
      const txReceipt = await wallet.waitForTransactionReceipt({
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
