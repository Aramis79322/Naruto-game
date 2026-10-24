# -*- coding: utf-8 -*-
"""Incrusta los GLB optimizados en js/models3d-data.js.

Así Konoha 3D funciona al abrir index.html directamente (file://), sin
necesidad de un servidor HTTP local. Vuelve a ejecutar este script si
cambias los modelos de assets/models/.
"""
import base64
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = {
    'village': 'assets/models/village_opt.glb',
    'chars': 'assets/models/naruto_sasuke_opt.glb',
    'kakashi': 'assets/models/kakashi.glb',
}
OUT = os.path.join(ROOT, 'js', 'models3d-data.js')


def main():
    parts = []
    total = 0
    for key, rel in MODELS.items():
        path = os.path.join(ROOT, rel.replace('/', os.sep))
        with open(path, 'rb') as fh:
            raw = fh.read()
        b64 = base64.b64encode(raw).decode('ascii')
        total += len(b64)
        parts.append('  %s: "%s"' % (key, b64))
        print('%-8s %8d bytes -> %8d base64' % (key, len(raw), len(b64)))
    header = (
        '/* Modelos 3D integrados para que Konoha 3D funcione desde file://.\n'
        '   Generado por tools/embed_models.py. No editar a mano.\n'
        '   Modelos originales: assets/models/*.glb\n'
        '   Naruto/Sasuke: ronildo.facanha (CC BY 4.0) - Sketchfab\n'
        '   Aldea de Konoha: kyrox (CC BY 4.0) - Sketchfab\n'
        '   Kakashi: Tigerar1 (Sketchfab Standard) - Sketchfab */\n'
        'window.K3D_MODELS = {\n'
    )
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(header)
        fh.write(',\n'.join(parts))
        fh.write('\n};\n')
    print('escrito %s (%d caracteres base64)' % (OUT, total))


if __name__ == '__main__':
    main()
