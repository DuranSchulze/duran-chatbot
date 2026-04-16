export async function loginRequest(
  username: string,
  password: string,
): Promise<{ token: string }> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Login failed (${res.status})`);
  }

  return res.json() as Promise<{ token: string }>;
}
