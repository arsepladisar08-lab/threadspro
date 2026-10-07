import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface ShortcutHandlers {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGuide?: () => void;
  onCloseModals?: () => void;
}

export function useKeyboardShortcuts({
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenGuide,
  onCloseModals,
}: ShortcutHandlers) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      const isModifier = e.ctrlKey || e.metaKey;

      // Handle Escape: always triggers regardless of focus to close active modal/drawer/palette
      if (e.key === "Escape") {
        if (onCloseModals) {
          onCloseModals();
        }
        return;
      }

      // Handle Ctrl/Cmd shortcuts (works even inside inputs)
      if (isModifier) {
        // Ctrl/Cmd + B: Toggle Sidebar
        if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          onToggleSidebar?.();
          return;
        }

        // Ctrl/Cmd + K: Open Command Palette
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          onOpenCommandPalette?.();
          return;
        }
      }

      // If user is currently typing in input/textarea/editable without Ctrl/Cmd, do not trigger single-key or Alt shortcuts
      if (isInput) {
        return;
      }

      // Alt + 1..5: Fast navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            navigate("/");
            return;
          case "2":
            e.preventDefault();
            navigate("/kalender");
            return;
          case "3":
            e.preventDefault();
            navigate("/cek");
            return;
          case "4":
            e.preventDefault();
            navigate("/balas");
            return;
          case "5":
            e.preventDefault();
            navigate("/metrik");
            return;
        }
      }

      // '?' or Shift + '/': Open Guide Modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onOpenGuide?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onToggleSidebar, onOpenCommandPalette, onOpenGuide, onCloseModals]);
}
