export default function ReserveLoading() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#C4973A]"></div>
            <p className="mt-8 font-serif italic text-[#8B1A1A] animate-pulse">Loading Diba Reservations...</p>
        </div>
    );
}
