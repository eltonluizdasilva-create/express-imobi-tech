export default function Card({ children, className = "", title }) {
    return (
        <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm ${className}`}>
            {title && <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>}
            {children}
        </div>
    );
}
