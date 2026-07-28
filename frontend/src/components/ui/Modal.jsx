import * as React from "react"
import { cn } from "./Button"
import * as Icons from "lucide-react"

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-[8px] shadow-swiss w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-divider">
        <div className="flex justify-between items-center p-4 border-b border-divider">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-surface-hover text-muted transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
