import { redirect } from 'next/navigation';

export default function PaymentLinksRedirectPage() {
  redirect('/invoice-links');
}
