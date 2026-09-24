"""Local preview without installing dependencies: python preview.py"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        translated = Path(super().translate_path(path))
        if translated.parent == ROOT and translated.name in ('reader.js', 'reader.css', 'bible-data.js', 'install.js', 'backup.js', 'manifest.webmanifest', 'favicon.svg', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'):
            return str(ROOT / 'public' / translated.name)
        return str(translated)

if __name__ == '__main__':
    import os
    os.chdir(ROOT)
    ThreadingHTTPServer(('0.0.0.0', 5173), Handler).serve_forever()
