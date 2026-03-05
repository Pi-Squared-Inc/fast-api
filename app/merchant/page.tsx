import { redirect } from 'next/navigation';

export default function MerchantRedirectPage() {
  redirect('/merchant-dashboard');
}
