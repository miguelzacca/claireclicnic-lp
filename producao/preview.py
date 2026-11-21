"""Servidor local para testar a navegação e o seek do filme por HTTP Range."""

import argparse
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


class LocalServer(ThreadingHTTPServer):
    request_queue_size = 32


class Preview(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        self.remaining = None
        path = Path(self.translate_path(self.path)).resolve()
        if not path.is_relative_to(ROOT) or any(
            part.startswith(".") for part in path.relative_to(ROOT).parts
        ):
            self.send_error(HTTPStatus.NOT_FOUND)
            return None

        request = self.headers.get("Range")
        if not request or path.suffix != ".mp4" or not path.is_file():
            return super().send_head()

        size = path.stat().st_size
        bounds = re.fullmatch(r"bytes=(\d*)-(\d*)", request.strip())
        if bounds is not None and any(bounds.groups()):
            first, last = bounds.groups()
            start = int(first) if first else max(0, size - int(last))
            end = min(size - 1, int(last)) if first and last else size - 1
            if start <= end:
                return self.partial(path, size, start, end)

        self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
        self.send_header("Content-Range", f"bytes */{size}")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return None

    def partial(self, path, size, start, end):
        stream = path.open("rb")
        stream.seek(start)
        self.remaining = end - start + 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self.remaining))
        self.end_headers()
        return stream

    def end_headers(self):
        if self.path.partition("?")[0].endswith(".mp4"):
            self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def copyfile(self, source, output):
        if self.remaining is None:
            return super().copyfile(source, output)
        for buffer in iter(lambda: source.read(min(65536, self.remaining)), b""):
            output.write(buffer)
            self.remaining -= len(buffer)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    with LocalServer(("127.0.0.1", args.port), Preview) as server:
        print(f"Abra http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()
