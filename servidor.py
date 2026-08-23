import functools
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")
PORT = 8000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_PUT(self):
        if self.path.split("?")[0] != "/data.json":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            json.loads(body.decode("utf-8"))
        except Exception:
            self.send_error(400, "JSON invalido")
            return
        try:
            with open(DATA_FILE, "wb") as f:
                f.write(body)
        except OSError as exc:
            self.send_error(500, str(exc))
            return
        payload = json.dumps({"ok": True}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


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
