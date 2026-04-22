#!/usr/bin/env bash
# Deploy do Education Analytics AI para Vercel.
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Pré-requisitos:
#   - Estar na pasta raiz do projeto (esta mesma pasta)
#   - git configurado (user.name/user.email) com permissão de push para a origin
#   - Vercel já conectado ao repositório GitHub (está: projeto "education-analytics")

set -euo pipefail

echo ">> Limpando lock de git (se existir)..."
rm -f .git/index.lock || true

echo ">> Verificando remote..."
git remote -v | grep -q 'github.com' || { echo "ERRO: remote GitHub não encontrado"; exit 1; }

echo ">> Rodando typecheck backend..."
npx tsc -p tsconfig.build.json --outDir /tmp/ea-dist-predeploy

echo ">> Rodando typecheck frontend..."
(cd frontend && npx tsc --noEmit)

echo ">> Build do frontend (mesma etapa que a Vercel roda)..."
(cd frontend && npm run build)

echo ">> git status antes do commit:"
git status --short

echo
read -r -p "Commitar e enviar para origin/main? [s/N] " resp
case "$resp" in
  s|S|y|Y|sim|SIM)
    git add -A
    git commit -m "feat(pedagogy): modulo pedagogico + handlers Vercel para novas rotas

- Dominio: Student, Class, Goal, Evaluation (CPF BR + MANA/MPA/MA)
- Infra: JsonRepository atomico + SMTP zero-dep + digest diario idempotente
- API: /students /goals /classes /evaluations /email/digest
- Frontend: paginas Alunos, Metas, Turmas e detalhe da turma (grid de avaliacoes)
- Testes: features Cucumber em pt + node:test para rotas + smoke end-to-end
- Vercel: handlers em api/ para as novas rotas"
    git push origin main
    echo
    echo ">> Push concluido. A Vercel vai auto-deployar em ~1-2 minutos."
    echo ">> Dashboard: https://vercel.com/dashboard"
    ;;
  *)
    echo "Abortado. Nada foi commitado."
    ;;
esac

echo
echo "============================================================"
echo "ACAO MANUAL NA VERCEL (uma unica vez):"
echo "------------------------------------------------------------"
echo "Project Settings -> Environment Variables, adicionar:"
echo "  JSON_STORAGE_DIR=/tmp/data"
echo "  SMTP_HOST=<seu host, ex: smtp.gmail.com>"
echo "  SMTP_PORT=587"
echo "  SMTP_SECURE=false"
echo "  SMTP_USER=<seu e-mail>"
echo "  SMTP_PASS=<app password>"
echo "  SMTP_FROM=no-reply@<seu dominio>"
echo "(Opcional) EMAIL_DIGEST_INTERVAL_MS=86400000"
echo
echo "IMPORTANTE: o filesystem da Vercel e efemero fora de /tmp."
echo "Os JSONs do modulo pedagogico sobrevivem apenas enquanto o"
echo "container ficar quente. Para persistencia real, migrar os"
echo "repositorios JSON para Postgres (Supabase ja esta provisionado)."
echo "============================================================"
