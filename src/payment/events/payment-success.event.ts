export class PaymentSuccessEvent {
  constructor(
    public paymentIntentId: string,
    public stripeProductId: string,
    public amount: number,
    public currency: string,
    public stripeFees: number,
    public availableOn: Date,
  ) {}
}

export const PAYMENT_SUCCESS = 'payment.success';
