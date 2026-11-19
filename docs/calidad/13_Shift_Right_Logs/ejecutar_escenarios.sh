#!/bin/zsh
# Escenarios (a), (b), (c) y (e) del README contra la API local (http://localhost:3001).
# La contraseña viene de SEED_PASSWORD en el entorno y no se imprime. No usa npm run seed.
# Uso, desde la raíz: node --env-file=.env -e "process.exit(require('node:child_process').spawnSync('zsh',['docs/calidad/13_Shift_Right_Logs/ejecutar_escenarios.sh'],{stdio:'inherit'}).status)"
API=http://localhost:3001
lee() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log($1))"; }

# Oferta ya existente con unidades disponibles (no se crea ninguna).
OFERTA=$(curl -s $API/ofertas | lee "JSON.parse(s).find(x=>x.disponible>=1).id")

echo "== (a) flujo principal: login + reserva (+ cancelación para devolver la unidad)"
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d "{\"correo\":\"consumidor1@foodsave.test\",\"contrasena\":\"$SEED_PASSWORD\"}" | lee "JSON.parse(s).accessToken")
RES=$(curl -s -w ' HTTP=%{http_code}' -X POST $API/reservas -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"ofertaId\":\"$OFERTA\",\"cantidad\":1}")
echo "reserva: ${RES##* }"
RID=$(echo "${RES% HTTP=*}" | lee "JSON.parse(s).id")
curl -s -o /dev/null -w "cancelar: HTTP=%{http_code}\n" -X POST $API/reservas/$RID/cancelar -H "Authorization: Bearer $TOKEN"

echo "== (b) contraseña incorrecta"
curl -s -w ' HTTP=%{http_code}\n' -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"consumidor1@foodsave.test","contrasena":"clave-incorrecta-log"}'

echo "== (c) dato inválido"
curl -s -w ' HTTP=%{http_code}\n' -X POST $API/reservas -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"ofertaId":"no-es-un-id","cantidad":"abc"}'

echo "== (e) duración: 5 consultas de solo lectura"
for i in 1 2 3 4 5; do curl -s -o /dev/null -w "GET /ofertas: HTTP=%{http_code}\n" "$API/ofertas?q=E2E"; done
