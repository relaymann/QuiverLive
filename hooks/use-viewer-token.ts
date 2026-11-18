import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { createViewerToken } from "@/actions/token";

export const useViewerToken = (hostIdentity: string) => {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const createToken = async () => {
      setIsLoading(true); setError(""); setToken(""); setName(""); setIdentity("");
      try {
        const viewerToken = await createViewerToken(hostIdentity);
        const decoded = jwtDecode(viewerToken) as JwtPayload & { name?: string };
        if (cancelled) return;
        setToken(viewerToken); setName(decoded.name || ""); setIdentity(decoded.sub || "");
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : "Unable to create a viewer token";
        setError(message); toast.error(message);
      } finally { if (!cancelled) setIsLoading(false); }
    };
    void createToken();
    return () => { cancelled = true; };
  }, [hostIdentity, retryKey]);

  const retry = useCallback(() => setRetryKey((current) => current + 1), []);
  return { token, name, identity, isLoading, error, retry };
};
