import React, { useEffect, useRef } from "react";

export type useRunOnceProps = {
  fn: () => void;
  sessionKey?: string;
};

// TODO: this is a tempory hack to fix reeact strict mode issues
export const useRunOnce: React.FC<useRunOnceProps> = ({ fn, sessionKey }) => {
  const triggered = useRef<boolean>(false);

  useEffect(() => {
    const hasBeenTriggered = sessionKey
      ? sessionStorage.getItem(sessionKey)
      : triggered.current;

    if (!hasBeenTriggered) {
      fn();
      triggered.current = true;

      if (sessionKey) {
        sessionStorage.setItem(sessionKey, "true");
      }
    }
  }, [fn, sessionKey]);

  return null;
};
