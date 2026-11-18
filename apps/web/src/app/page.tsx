import { redirect } from 'next/navigation';

/** La página de inicio es el listado público de ofertas. */
export default function Home() {
  redirect('/ofertas');
}
