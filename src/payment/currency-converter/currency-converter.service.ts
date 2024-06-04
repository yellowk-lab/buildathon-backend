import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { CurrencyConverterError } from './currency-converter.errors';
import { AxiosError } from 'axios';

@Injectable()
export class CurrencyConverterService {
  static DEFAULT_CURRENCY = 'CHF';
  static API_BASE_CURRENCY = 'EUR';
  private apiURL: string;
  private apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    readonly configService: ConfigService,
  ) {
    this.apiURL = configService.get<string>('FIXER_API_URL');
    this.apiKey = configService.get<string>('FIXER_API_KEY');
  }

  async getRates(currencies: string[]) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(this.apiURL.concat('latest'), {
          params: {
            access_key: this.apiKey,
            symbols: currencies.toString(),
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new CurrencyConverterError(
              CurrencyConverterError.API_CALL_ERROR,
              JSON.stringify(error),
            );
          }),
        ),
    );
    return data.rates;
  }

  // @TODO: Get a paid subscription
  // Currently as the free plan allows only base currency to be EUR
  // and that only currency rates functions available, conversion is made manually
  convertCHFToOtherCurrency(
    amountInCHF: number,
    targetCurrency: string,
    rates: Record<string, number>,
  ): number {
    const rateCHFtoEUR = 1 / rates['CHF']; // Inverting since base is EUR
    const rateEURtoTarget = rates[targetCurrency];
    if (!rateEURtoTarget) {
      throw new Error(`Conversion rate not found for ${targetCurrency}`);
    }

    const amountInEUR = amountInCHF * rateCHFtoEUR;
    const convertedAmount = amountInEUR * rateEURtoTarget;

    return Math.round(convertedAmount);
  }
}
