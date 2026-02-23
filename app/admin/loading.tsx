export default function AdminLoading() {
    return (
        <div className="flex items-center justify-center p-20">
            <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#8B1A1A]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#8B1A1A]">DIBA</span>
                </div>
            </div>
        </div>
    );
}
