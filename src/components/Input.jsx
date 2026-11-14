export default function Input({ label, className = "", ...props }) {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-slate-400">{label}</label>}
            <input
                className={`bg-slate-800 border-slate-700 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${className}`}
                {...props}
            />
        </div>
    );
}
