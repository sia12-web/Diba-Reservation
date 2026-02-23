import ReserveLayoutClient from './ReserveLayoutClient';

export const metadata = {
    title: 'Reserve a Table — Diba Restaurant Montreal',
    description: 'Book your table at Diba, Montreal\'s premier Persian restaurant on Somerled Ave.',
    openGraph: {
        title: 'Diba Restaurant — Reserve a Table',
        description: 'Authentic Persian cuisine in Montreal. Book online.',
        url: 'https://dibarestaurant.ca/reserve'
    }
};

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
    return <ReserveLayoutClient>{children}</ReserveLayoutClient>;
}
