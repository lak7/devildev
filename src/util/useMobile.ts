import { getSelectorsByUserAgent } from "react-device-detect";
import { useEffect, useState } from "react";

export const useMobile = () => {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    // Return early if running on server
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    // Check both device type and screen width
    const checkMobile = () => {
      const { isMobile } = getSelectorsByUserAgent(navigator.userAgent);
      const isMobileWidth = window.innerWidth <= 768; // Common breakpoint for mobile
      setIsMobileView(isMobile || isMobileWidth);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobileView;
};
