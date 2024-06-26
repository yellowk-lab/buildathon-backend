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
  fromHex,
  decodeFunctionData,
  isAddressEqual,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { lootABI } from './abis/nft.abi';

@Injectable()
export class Web3Service {
  private walletClient;

  constructor(private configService: ConfigService) {
    const account: PrivateKeyAccount = privateKeyToAccount(
      this.configService.get<Hex>('PRIVATE_KEY'),
    );
    const isMainnet = this.configService.get<string>('MAINNET');
    const provider: string = this.configService.get<string>('RPC_PROVIDER_URL');
    let chainConfig: any = baseSepolia;
    if (isMainnet == 'true') {
      chainConfig = base;
    }
    this.walletClient = createWalletClient({
      account,
      chain: chainConfig as Chain,
      transport: http(provider),
    }).extend(publicActions);
  }

  async mintNFT(receiver: string, tokenUri: string): Promise<number> {
    const contractAddress: Address =
      this.configService.get<Address>('NFT_CONTRACT');
    const mintArgs = [receiver, tokenUri];
    let tokenId: number = -1;
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
        tokenId = fromHex(txReceipt.logs[1].data, 'number');
      }
      return tokenId;
    } catch (err) {
      return tokenId;
    }
  }

  async tokenIdWasTransferedToContract(
    txHash: string,
    from: string,
    tokenId: bigint,
  ): Promise<boolean> {
    try {
      const { status } = await this.walletClient.getTransactionReceipt({
        hash: txHash,
      });
      const transaction = await this.walletClient.getTransaction({
        hash: txHash,
      });
      const { functionName, args } = decodeFunctionData({
        abi: lootABI,
        data: transaction.input,
      });
      const [sender, receiver, _tokenId] = args;
      if (
        status == 'success' &&
        args.length == 3 &&
        functionName == 'transferFrom'
      ) {
        const contractAddress = this.configService.get<string>('NFT_CONTRACT');
        return (
          from == sender &&
          isAddressEqual(contractAddress as Address, receiver as Address) &&
          tokenId == _tokenId
        );
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }
}
