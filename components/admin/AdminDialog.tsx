"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

// Chỉ báo đóng cho component cha sau khi animation kết thúc để tránh mất hiệu ứng thoát.
export default function AdminDialog({ children, label, className, busy = false, onClose }: {
  children: (close: () => void) => ReactNode;
  label: string;
  className: string;
  busy?: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog.Root open={open} disablePointerDismissal
      onOpenChange={(next, event) => { if (busy) event.cancel(); else setOpen(next); }}
      onOpenChangeComplete={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="shop-backdrop fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup aria-label={label} className={`shop-popup fixed left-1/2 top-1/2 z-50 max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto ${className}`}>
          {children(() => { if (!busy) setOpen(false); })}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
