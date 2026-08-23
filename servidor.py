import json
import os
import secrets
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")
PORT = 8000

USUARIO_ADMIN = "admin"
CLAVE_ADMIN = "admin"

TOKENS_VALIDOS = set()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def _responder(self, status, payload, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        for nombre, valor in (extra_headers or []):
            self.send_header(nombre, valor)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _token_sesion(self):
        cookie = self.headers.get("Cookie", "")
        for parte in cookie.split(";"):
            nombre, _, valor = parte.strip().partition("=")
            if nombre == "es_session":
                return valor
        return None

    def _sesion_valida(self):
        token = self._token_sesion()
        return bool(token) and token in TOKENS_VALIDOS

    def do_GET(self):
        if self.path.split("?")[0] == "/api/check":
            if self._sesion_valida():
                self._responder(200, {"ok": True})
            else:
                self._responder(401, {"ok": False})
            return
        super().do_GET()

    def do_POST(self):
        ruta = self.path.split("?")[0]
        try:
            length = int(self.headers.get("Content-Length", 0))
            cuerpo = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except Exception:
            self._responder(400, {"ok": False, "error": "JSON invalido"})
            return

        if ruta == "/api/login":
            usuario = str(cuerpo.get("usuario", ""))
            clave = str(cuerpo.get("clave", ""))
            if usuario == USUARIO_ADMIN and clave == CLAVE_ADMIN:
                token = secrets.token_hex(32)
                TOKENS_VALIDOS.add(token)
                self._responder(200, {"ok": True}, [
                    ("Set-Cookie", f"es_session={token}; Path=/; HttpOnly; SameSite=Lax")
                ])
            else:
                self._responder(401, {"ok": False, "error": "Credenciales incorrectas"})
            return

        if ruta == "/api/logout":
            TOKENS_VALIDOS.discard(self._token_sesion())
            self._responder(200, {"ok": True}, [
                ("Set-Cookie", "es_session=; Path=/; HttpOnly; Max-Age=0")
            ])
            return

        self._responder(404, {"ok": False})

    def do_PUT(self):
        if self.path.split("?")[0] != "/data.json":
            self.send_error(404)
            return
        if not self._sesion_valida():
            self._responder(401, {"ok": False, "error": "No autorizado"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            json.loads(body.decode("utf-8"))
        except Exception:
            self._responder(400, {"ok": False, "error": "JSON invalido"})
            return
        try:
            with open(DATA_FILE, "wb") as f:
                f.write(body)
        except OSError as exc:
            self._responder(500, {"ok": False, "error": str(exc)})
            return
        self._responder(200, {"ok": True})


def main():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Eurovision Spain -> http://localhost:{PORT}/index.html")
    print(f"Carpeta servida : {BASE_DIR}")
    print("Ctrl+C para detener")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido")


if __name__ == "__main__":
    main()
