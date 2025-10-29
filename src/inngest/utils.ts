import Sandbox from "@e2b/code-interpreter"; 

export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

// Best-effort extractor for the latest assistant message's plain text
export function lastAssistantTextMessageContent(result: any): string | null {
  if (!result) return null;

  const candidates: any[] = [];
  const maybeArrays = [
    result.messages,
    result.output?.messages,
    result.outputs?.messages,
    result.state?.messages,
    result.history,
  ];

  for (const arr of maybeArrays) {
    if (Array.isArray(arr)) candidates.push(...arr);
  }

  // Search from the end for an assistant message
  for (let i = candidates.length - 1; i >= 0; i--) {
    const msg = candidates[i];
    const role = msg?.role || msg?.author || msg?.type;
    const isAssistant = typeof role === "string" && role.toLowerCase().includes("assistant");
    if (!isAssistant) continue;

    const content = msg?.content ?? msg?.text ?? msg?.data?.text;
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      // Some SDKs represent content as an array of parts
      const text = content
        .map((part: any) =>
          typeof part === "string"
            ? part
            : part?.text ?? part?.content ?? part?.value ?? ""
        )
        .join("")
        .trim();
      if (text) return text;
    }

    if (content && typeof content === "object") {
      const text = content.text ?? content.value ?? content.content;
      if (typeof text === "string" && text.trim()) return text;
    }
  }

  // Fallbacks some agents use
  if (typeof result.text === "string") return result.text;
  if (typeof result.output === "string") return result.output;

  return null;
}