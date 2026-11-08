import "server-only";
import { getServerEnv, isE2EMockMode } from "./env";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token server-side before sending any bouquet.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  const env = getServerEnv();

  if (isE2EMockMode()) {
    // Allow explicit test tokens in local automated Playwright smoke tests
    return token.trim().length > 0 && token !== "invalid-turnstile-token";
  }

  const formData = new URLSearchParams();
  formData.set("secret", env.TURNSTILE_SECRET_KEY);
  formData.set("response", token);
  if (remoteIp && remoteIp !== "127.0.0.1") {
    formData.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch (error) {
    console.error("[Turnstile] Verification network error:", error);
    return false;
  }
}
