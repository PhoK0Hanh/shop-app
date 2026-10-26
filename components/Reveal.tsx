"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Nội dung mặc định hiển thị; chỉ chuẩn bị animation cho khối nằm dưới màn hình.
export default function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.dataset.reveal = "pending";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.reveal = "visible";
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => { observer.disconnect(); delete element.dataset.reveal; };
  }, []);
  return <div ref={ref} className={`shop-reveal ${className ?? ""}`}>{children}</div>;
}
