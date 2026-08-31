window.Lorah = window.Lorah || {};
Lorah.Storage = (() => {
  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: "same-origin", ...options });
    if (response.status === 401) {
      location.assign("/login");
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || "Não foi possível concluir a solicitação.");
    return body;
  }
  async function load() { return request("/api/datasets/active"); }
  async function upload(file) {
    const form = new FormData();
    form.append("file", file);
    return request("/api/datasets/import", { method: "POST", body: form });
  }
  return { load, upload, request };
})();
