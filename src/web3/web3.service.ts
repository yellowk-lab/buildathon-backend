import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  Hex,
  PrivateKeyAccount,
  Address,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

@Injectable()
export class Web3Service {
  constructor(private configService: ConfigService) {
    const account: PrivateKeyAccount = privateKeyToAccount(
      configService.get<Hex>('PRIVATE_KEY'),
    );
    let chain, transport;

    if (configService.get<boolean>('WEB3_MAINNET')) {
      chain = base;
      transport = http(configService.get<string>('BASE_URL'));
    } else {
      chain = baseSepolia;
      transport = http(configService.get<string>('BASE_SEPOLIA_URL'));
    }
    this.publicClient = createPublicClient({
      chain,
      transport,
    });
    this.walletClient = createWalletClient({
      account,
      chain,
      transport,
    });
  }

  private publicClient;
  private walletClient;

  async mintNFT(receiver: Address, lootId: number): Promise<boolean> {
    return true; // transaction status success
  }
}
