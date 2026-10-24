"""Optimiza los GLB de Konoha 3D para equipos modestos.

- Elimina las animaciones del pack de personajes (el juego usa poses procedurales).
- Elimina la geometria de fondo (Cylinder) y sus recursos huerfanos.
- Recomprime las texturas a JPEG de alta calidad.
- Reempaqueta bufferViews/accessors para no dejar peso muerto.

Uso: python tools/optimize_models.py
"""
from __future__ import annotations

import io
import json
import os
import struct

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "assets", "models")


def read_glb(path: str):
    data = open(path, "rb").read()
    magic, version, length = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67:
        raise ValueError("No es un GLB: " + path)
    offset = 12
    chunks = []
    while offset < length:
        size, ctype = struct.unpack_from("<II", data, offset)
        offset += 8
        chunks.append((ctype, data[offset:offset + size]))
        offset += size
    if not chunks or chunks[0][0] != 0x4E4F534A:
        raise ValueError("GLB sin chunk JSON")
    doc = json.loads(chunks[0][1].decode("utf-8"))
    binary = b""
    for ctype, payload in chunks[1:]:
        if ctype == 0x004E4942:
            binary = payload
            break
    return doc, binary


def align4(value: int) -> int:
    return (value + 3) & ~3


def write_glb(path: str, doc: dict, binary: bytes):
    doc.setdefault("buffers", [])
    if not doc["buffers"]:
        doc["buffers"].append({})
    doc["buffers"][0]["byteLength"] = len(binary)
    raw_json = json.dumps(doc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    raw_json += b" " * (align4(len(raw_json)) - len(raw_json))
    raw_bin = binary + b"\x00" * (align4(len(binary)) - len(binary))
    total = 12 + 8 + len(raw_json) + 8 + len(raw_bin)
    with open(path, "wb") as handle:
        handle.write(struct.pack("<III", 0x46546C67, 2, total))
        handle.write(struct.pack("<II", len(raw_json), 0x4E4F534A))
        handle.write(raw_json)
        handle.write(struct.pack("<II", len(raw_bin), 0x004E4942))
        handle.write(raw_bin)


def accessor_bytes(doc: dict, binary: bytes, accessor_index: int) -> bytes:
    accessor = doc["accessors"][accessor_index]
    view = doc["bufferViews"][accessor["bufferView"]]
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    end = start + accessor["count"] * component_bytes(doc, accessor)
    return binary[start:end]


def component_bytes(doc: dict, accessor: dict) -> int:
    sizes = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    types = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
    return sizes[accessor["componentType"]] * types[accessor["type"]]


def optimize_character(source: str, target: str):
    doc, binary = read_glb(source)

    # 1. Quitar el decorado curvo y sus nodos.
    removed_nodes = set()
    for index, node in enumerate(doc["nodes"]):
        if node.get("name") in ("Cylinder", "Cylinder_Material_0"):
            removed_nodes.add(index)
    if removed_nodes:
        old_nodes = doc["nodes"]
        keep = [i for i in range(len(old_nodes)) if i not in removed_nodes]
        remap = {old: new for new, old in enumerate(keep)}
        new_nodes = []
        for old in keep:
            node = dict(old_nodes[old])
            if "children" in node:
                node["children"] = [remap[c] for c in node["children"] if c in remap]
            new_nodes.append(node)
        doc["nodes"] = new_nodes
        for scene in doc.get("scenes", []):
            scene["nodes"] = [remap[n] for n in scene.get("nodes", []) if n in remap]
        for skin in doc.get("skins", []):
            skin["joints"] = [remap[n] for n in skin.get("joints", []) if n in remap]
            if "skeleton" in skin and skin["skeleton"] in remap:
                skin["skeleton"] = remap[skin["skeleton"]]

    # 2. Quitar animaciones: el juego anima las piernas/brazos por codigo.
    doc.pop("animations", None)

    # 3. Recolectar accessors y bufferViews usados.
    used_accessors = set()

    def use_accessor(index):
        if index is not None:
            used_accessors.add(index)

    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            # Los materiales son unlit: las normales no aportan nada.
            primitive.get("attributes", {}).pop("NORMAL", None)
            for accessor in primitive.get("attributes", {}).values():
                use_accessor(accessor)
            use_accessor(primitive.get("indices"))
            for target in primitive.get("targets", []):
                for accessor in target.values():
                    use_accessor(accessor)
    for skin in doc.get("skins", []):
        use_accessor(skin.get("inverseBindMatrices"))

    used_views = set()
    for accessor_index in used_accessors:
        view = doc["accessors"][accessor_index].get("bufferView")
        if view is not None:
            used_views.add(view)
    for image in doc.get("images", []):
        view = image.get("bufferView")
        if view is not None:
            used_views.add(view)

    # 4. Recomprimir texturas.
    image_bytes = {}
    for index, image in enumerate(doc.get("images", [])):
        view_index = image.get("bufferView")
        if view_index is None:
            continue
        view = doc["bufferViews"][view_index]
        start = view.get("byteOffset", 0)
        raw = binary[start:start + view["byteLength"]]
        try:
            picture = Image.open(io.BytesIO(raw)).convert("RGB")
            out = io.BytesIO()
            picture.save(out, "JPEG", quality=90, optimize=True)
            image_bytes[view_index] = out.getvalue()
            image["mimeType"] = "image/jpeg"
        except Exception as exc:  # noqa: BLE001
            image_bytes[view_index] = raw
            print("  ! textura sin recomprimir:", exc)
    # Fijar texturas en formato JPEG aunque el GLB original declare png.
    for image in doc.get("images", []):
        if image.get("bufferView") in image_bytes:
            image["mimeType"] = "image/jpeg"
            image.pop("uri", None)

    # 5. Reempaquetar accessors y bufferViews en bloques compactos.
    new_binary = bytearray()
    new_views = []
    new_accessors = []
    accessor_remap = {}
    for old_accessor in sorted(used_accessors):
        accessor = dict(doc["accessors"][old_accessor])
        source_view = doc["bufferViews"][accessor["bufferView"]]
        element_size = component_bytes(doc, accessor)
        stride = source_view.get("byteStride", element_size)
        start = source_view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        count = accessor["count"]
        if stride == element_size:
            payload = binary[start:start + count * element_size]
        else:
            payload = bytearray()
            for i in range(count):
                offset = start + i * stride
                payload.extend(binary[offset:offset + element_size])
            payload = bytes(payload)
        while len(new_binary) % 4:
            new_binary.append(0)
        new_views.append({"buffer": 0, "byteOffset": len(new_binary), "byteLength": len(payload)})
        new_binary.extend(payload)
        accessor["bufferView"] = len(new_views) - 1
        accessor.pop("byteOffset", None)
        accessor_remap[old_accessor] = len(new_accessors)
        new_accessors.append(accessor)

    image_remap_views = {}
    for old_view, payload in image_bytes.items():
        while len(new_binary) % 4:
            new_binary.append(0)
        new_views.append({"buffer": 0, "byteOffset": len(new_binary), "byteLength": len(payload)})
        new_binary.extend(payload)
        image_remap_views[old_view] = len(new_views) - 1

    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitive["attributes"] = {name: accessor_remap[index] for name, index in primitive.get("attributes", {}).items()}
            if "indices" in primitive:
                primitive["indices"] = accessor_remap[primitive["indices"]]
            for target in primitive.get("targets", []):
                for name in list(target):
                    target[name] = accessor_remap[target[name]]
    for skin in doc.get("skins", []):
        if "inverseBindMatrices" in skin:
            skin["inverseBindMatrices"] = accessor_remap[skin["inverseBindMatrices"]]
    for image in doc.get("images", []):
        if "bufferView" in image:
            image["bufferView"] = image_remap_views[image["bufferView"]]

    doc["accessors"] = new_accessors
    doc["bufferViews"] = new_views

    # 6. Eliminar meshes/materiales/imagenes que ya nadie usa.
    used_meshes = set()
    for node in doc["nodes"]:
        if "mesh" in node:
            used_meshes.add(node["mesh"])
    mesh_remap = {}
    new_meshes = []
    for old in sorted(used_meshes):
        mesh_remap[old] = len(new_meshes)
        new_meshes.append(doc["meshes"][old])
    for node in doc["nodes"]:
        if "mesh" in node:
            node["mesh"] = mesh_remap[node["mesh"]]
    doc["meshes"] = new_meshes

    used_materials = set()
    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            if "material" in primitive:
                used_materials.add(primitive["material"])
    material_remap = {}
    new_materials = []
    for old in sorted(used_materials):
        material_remap[old] = len(new_materials)
        new_materials.append(doc["materials"][old])
    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            if "material" in primitive:
                primitive["material"] = material_remap[primitive["material"]]
    doc["materials"] = new_materials

    used_textures = set()
    for material in doc.get("materials", []):
        pbr = material.get("pbrMetallicRoughness", {})
        for key in ("baseColorTexture", "metallicRoughnessTexture"):
            if key in pbr:
                used_textures.add(pbr[key]["index"])
        for key in ("normalTexture", "occlusionTexture", "emissiveTexture"):
            if key in material:
                used_textures.add(material[key]["index"])
    texture_remap = {}
    new_textures = []
    for old in sorted(used_textures):
        texture = dict(doc["textures"][old])
        if "source" in texture:
            texture["source"] = texture["source"]  # se remapea abajo
        texture_remap[old] = len(new_textures)
        new_textures.append(texture)
    for material in doc.get("materials", []):
        pbr = material.get("pbrMetallicRoughness", {})
        for key in ("baseColorTexture", "metallicRoughnessTexture"):
            if key in pbr:
                pbr[key]["index"] = texture_remap[pbr[key]["index"]]
        for key in ("normalTexture", "occlusionTexture", "emissiveTexture"):
            if key in material:
                material[key]["index"] = texture_remap[material[key]["index"]]
    doc["textures"] = new_textures

    used_images = set()
    for texture in doc.get("textures", []):
        if "source" in texture:
            used_images.add(texture["source"])
    image_remap = {}
    new_images = []
    for old in sorted(used_images):
        image_remap[old] = len(new_images)
        new_images.append(doc["images"][old])
    for texture in doc.get("textures", []):
        if "source" in texture:
            texture["source"] = image_remap[texture["source"]]
    doc["images"] = new_images

    if "samplers" in doc:
        used_samplers = set(t.get("sampler") for t in doc["textures"] if "sampler" in t)
        sampler_remap = {}
        new_samplers = []
        for old in sorted(s for s in used_samplers if s is not None):
            sampler_remap[old] = len(new_samplers)
            new_samplers.append(doc["samplers"][old])
        for texture in doc["textures"]:
            if "sampler" in texture:
                texture["sampler"] = sampler_remap[texture["sampler"]]
        doc["samplers"] = new_samplers

    doc["images"] = [image for image in doc.get("images", []) if image.get("bufferView") is not None] + [
        image for image in doc.get("images", []) if image.get("bufferView") is None
    ]
    # Las imagenes sin bufferView (uri) no se usan en este proyecto.
    if any("bufferView" not in image for image in doc.get("images", [])):
        raise ValueError("GLB con imagenes externas no soportado")

    write_glb(target, doc, bytes(new_binary))
    return len(new_binary)


def optimize_village(source: str, target: str):
    doc, binary = read_glb(source)
    used_accessors = set()
    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitive.get("attributes", {}).pop("NORMAL", None)
            primitive.get("attributes", {}).pop("COLOR_0", None)
            used_accessors.update(primitive.get("attributes", {}).values())
            if "indices" in primitive:
                used_accessors.add(primitive["indices"])
    used_views = {doc["accessors"][a]["bufferView"] for a in used_accessors}
    for image in doc.get("images", []):
        used_views.add(image["bufferView"])

    image_bytes = {}
    for image in doc.get("images", []):
        view = doc["bufferViews"][image["bufferView"]]
        start = view.get("byteOffset", 0)
        raw = binary[start:start + view["byteLength"]]
        picture = Image.open(io.BytesIO(raw)).convert("RGB")
        out = io.BytesIO()
        picture.save(out, "JPEG", quality=88, optimize=True)
        image_bytes[image["bufferView"]] = out.getvalue()
        image["mimeType"] = "image/jpeg"

    new_binary = bytearray()
    new_views = []
    new_accessors = []
    accessor_remap = {}
    for old in sorted(used_accessors):
        accessor = dict(doc["accessors"][old])
        source_view = doc["bufferViews"][accessor["bufferView"]]
        element_size = component_bytes(doc, accessor)
        stride = source_view.get("byteStride", element_size)
        start = source_view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        count = accessor["count"]
        if stride == element_size:
            payload = binary[start:start + count * element_size]
        else:
            payload = bytearray()
            for i in range(count):
                offset = start + i * stride
                payload.extend(binary[offset:offset + element_size])
            payload = bytes(payload)
        while len(new_binary) % 4:
            new_binary.append(0)
        new_views.append({"buffer": 0, "byteOffset": len(new_binary), "byteLength": len(payload)})
        new_binary.extend(payload)
        accessor["bufferView"] = len(new_views) - 1
        accessor.pop("byteOffset", None)
        accessor_remap[old] = len(new_accessors)
        new_accessors.append(accessor)

    for image in doc["images"]:
        payload = image_bytes[image["bufferView"]]
        while len(new_binary) % 4:
            new_binary.append(0)
        new_views.append({"buffer": 0, "byteOffset": len(new_binary), "byteLength": len(payload)})
        new_binary.extend(payload)
        image["bufferView"] = len(new_views) - 1

    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitive["attributes"] = {name: accessor_remap[index] for name, index in primitive.get("attributes", {}).items()}
            if "indices" in primitive:
                primitive["indices"] = accessor_remap[primitive["indices"]]

    doc["accessors"] = new_accessors
    doc["bufferViews"] = new_views
    write_glb(target, doc, bytes(new_binary))
    return len(new_binary)


def main():
    os.makedirs(MODELS, exist_ok=True)
    print("Optimizando personajes...")
    size = optimize_character(
        os.path.join(MODELS, "naruto_sasuke.glb"),
        os.path.join(MODELS, "naruto_sasuke_opt.glb"),
    )
    print("  -> naruto_sasuke_opt.glb", round(size / 1024 / 1024, 2), "MB de buffer")
    print("Optimizando aldea...")
    size = optimize_village(
        os.path.join(MODELS, "village.glb"),
        os.path.join(MODELS, "village_opt.glb"),
    )
    print("  -> village_opt.glb", round(size / 1024 / 1024, 2), "MB de buffer")
    print("Listo.")


if __name__ == "__main__":
    main()
