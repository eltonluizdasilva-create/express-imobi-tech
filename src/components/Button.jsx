export default function Button({ children, className = "", variant = "primary", ...props }) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer";
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30",
        secondary: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30",
        outline: "border border-slate-700 hover:bg-slate-800 text-slate-300",
        ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
