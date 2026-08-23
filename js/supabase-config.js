const SUPABASE_URL = "https://svwlmsvuelmwkgqakrhv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YravEsAyEHNbEZYJYeR6Jg_nalTficE";

function configuracionLista() {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    !SUPABASE_ANON_KEY.includes("PEGA_AQUI")
  );
}
