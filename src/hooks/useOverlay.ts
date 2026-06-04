import type { CSSProperties } from 'react';

interface UseOverlayOptions {
  isOpen: boolean;
  onClose: () => void;
}

interface UseOverlayReturn {
  overlayProps: {
    className: string;
    onClick: () => void;
  };
  overlayStyle: CSSProperties;
}

export function useOverlay({ isOpen, onClose }: UseOverlayOptions): UseOverlayReturn {
  return {
    overlayProps: {
      className: `fixed inset-0 z-[99] bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`,
      onClick: onClose,
    },
    overlayStyle: {},
  };
}
