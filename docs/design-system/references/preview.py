#!/usr/bin/env python3
"""Aperçu local hors ligne ; réécrit uniquement les réponses, jamais les archives."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import argparse
ROOT = Path(__file__).resolve().parent
REPLACEMENTS = {
    'https://unpkg.com/react@18.3.1/umd/react.production.min.js': '/dependencies/react.production.min.js',
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': '/dependencies/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js': '/dependencies/babel.min.js',
}
class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        p = Path(self.translate_path(self.path))
        if p.is_file() and p.suffix in ('.html', '.js'):
            text = p.read_text().replace('https://cdn.jsdelivr.net/npm/lucide-static@0.469.0/icons/', '/dependencies/lucide-icons/')
            for source, target in REPLACEMENTS.items():
                text = text.replace(source, target)
            if p.suffix == '.html':
                text = re.sub(r'<link[^>]*href="https://fonts.googleapis.com/css2[^\"]*"[^>]*>', '<link rel="stylesheet" href="/dependencies/offline-fonts.css">', text)
                text = re.sub(r'<link[^>]*rel="preconnect"[^>]*>', '', text)
            body = text.encode()
            self.send_response(200)
            self.send_header('Content-Type', ('text/html' if p.suffix == '.html' else 'text/javascript') + '; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=3217)
    args = parser.parse_args()
    print(f'http://127.0.0.1:{args.port}/claude-original/Design%20System.dc.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Preview).serve_forever()
