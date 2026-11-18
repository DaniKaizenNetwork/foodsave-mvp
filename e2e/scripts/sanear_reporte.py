"""Redacta secretos del reporte HTML y de los traces de Playwright antes de versionarlos.

Uso (desde la raíz; SEED_PASSWORD llega por el entorno y NO se imprime):
    node --env-file=.env -e "require('node:child_process').spawnSync('python3',['-I','e2e/scripts/sanear_reporte.py','docs/calidad/10_Playwright/reporte-html'],{stdio:'inherit'})"

Qué hace: recorre la carpeta, entra en los .zip (traces) y en el zip en base64 incrustado en
index.html, y sustituye la contraseña (cruda, escapada en JSON y codificada en URL) y los JWT.
Después verifica que no quede nada y sale con código 1 si queda algo.
"""
import base64, io, json, os, re, sys, urllib.parse, zipfile

clave = os.environ.get("SEED_PASSWORD", "")
if not clave:
    sys.exit("SEED_PASSWORD no está definida")

variantes = {clave, json.dumps(clave)[1:-1], urllib.parse.quote(clave, safe=""), urllib.parse.quote_plus(clave)}
patrones_fijos = [v.encode() for v in sorted(variantes, key=len, reverse=True)]
jwt = re.compile(rb"eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*")
hash_bcrypt = re.compile(rb"\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{50,}")


def limpiar_bytes(datos: bytes) -> bytes:
    for p in patrones_fijos:
        datos = datos.replace(p, b"[REDACTADO]")
    datos = jwt.sub(b"[JWT-REDACTADO]", datos)
    return hash_bcrypt.sub(b"[HASH-REDACTADO]", datos)


def limpiar_zip(contenido: bytes) -> bytes:
    salida = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(contenido)) as origen, zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED) as destino:
        for info in origen.infolist():
            datos = origen.read(info.filename)
            datos = limpiar_zip(datos) if info.filename.endswith(".zip") else limpiar_bytes(datos)
            destino.writestr(info.filename, datos)
    return salida.getvalue()


def restos_en_zip(contenido: bytes, ruta: str):
    with zipfile.ZipFile(io.BytesIO(contenido)) as z:
        for info in z.infolist():
            datos = z.read(info.filename)
            if info.filename.endswith(".zip"):
                yield from restos_en_zip(datos, f"{ruta}!{info.filename}")
            elif limpiar_bytes(datos) != datos:
                yield f"{ruta}!{info.filename}"


incrustado = re.compile(rb'(data:application/zip;base64,)([A-Za-z0-9+/=]+)')
carpeta = sys.argv[1]
for raiz, _, archivos in os.walk(carpeta):
    for nombre in archivos:
        ruta = os.path.join(raiz, nombre)
        with open(ruta, "rb") as f:
            datos = f.read()
        if nombre.endswith(".zip"):
            nuevo = limpiar_zip(datos)
        elif nombre.endswith((".html", ".json", ".txt", ".js", ".css")):
            nuevo = incrustado.sub(lambda m: m.group(1) + base64.b64encode(limpiar_zip(base64.b64decode(m.group(2)))), datos)
            nuevo = limpiar_bytes(nuevo)
        else:
            continue
        with open(ruta, "wb") as f:
            f.write(nuevo)

# Verificación: nada debe cambiar al volver a limpiar.
restos = []
for raiz, _, archivos in os.walk(carpeta):
    for nombre in archivos:
        ruta = os.path.join(raiz, nombre)
        with open(ruta, "rb") as f:
            datos = f.read()
        if nombre.endswith(".zip"):
            restos += list(restos_en_zip(datos, ruta))
        elif nombre.endswith((".html", ".json", ".txt", ".js", ".css")):
            for m in incrustado.finditer(datos):
                restos += list(restos_en_zip(base64.b64decode(m.group(2)), f"{ruta}[base64]"))
            if limpiar_bytes(incrustado.sub(b"", datos)) != incrustado.sub(b"", datos):
                restos.append(ruta)
if restos:
    print("RESTOS DE SECRETOS EN:", *restos, sep="\n  ")
    sys.exit(1)
print("verificación OK: sin contraseña, JWT ni hash en", carpeta)
