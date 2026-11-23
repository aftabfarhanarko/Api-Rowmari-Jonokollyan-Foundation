#!/usr/bin/env bash
# ==============================================================================
# Script to generate a self-signed TLS certificate for local / staging SSL testing
# ==============================================================================

set -euo pipefail

SSL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_FILE="${SSL_DIR}/selfsigned.crt"
KEY_FILE="${SSL_DIR}/selfsigned.key"

if [[ -f "${CERT_FILE}" && -f "${KEY_FILE}" ]]; then
    echo "✅ SSL certificate already exists at ${SSL_DIR}"
    exit 0
fi

echo "🔐 Generating 2048-bit self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=BD/ST=Rangpur/L=Kurigram/O=Romonijon Kallyan Foundation/OU=Tech/CN=api.romonijon.org"

chmod 600 "${KEY_FILE}"
chmod 644 "${CERT_FILE}"

echo "✅ Self-signed SSL certificate generated successfully in ${SSL_DIR}"
