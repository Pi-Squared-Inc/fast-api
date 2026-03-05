import { redirect } from 'next/navigation';

export default function MerchantCheckoutRedirectPage() {
  redirect('/merchant-dashboard/checkout');
}
