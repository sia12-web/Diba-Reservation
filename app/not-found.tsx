import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-9xl font-serif font-bold text-[#8B1A1A] opacity-10">404</h1>
                <div className="mt-[-4rem]">
                    <h2 className="text-3xl font-serif font-bold text-[#8B1A1A] mb-4">Something went missing</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        We couldn't find the page you're looking for. It might have been moved or doesn't exist anymore.
                    </p>
                    <Link href="/" className="btn-primary px-8 py-3 inline-block">
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
