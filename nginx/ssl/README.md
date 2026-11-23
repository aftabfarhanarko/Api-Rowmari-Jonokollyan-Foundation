# SSL / TLS Certificate Directory

This directory holds TLS certificates for Nginx HTTPS termination.

### Local Development / Staging:
To generate self-signed certificates for local testing, run:
```bash
bash nginx/ssl/generate-self-signed.sh
```

### Production Setup (Let's Encrypt / Custom Certificate):
Place your production certificates here or mount them via Docker volumes:
- `fullchain.pem` / `selfsigned.crt`
- `privkey.pem` / `selfsigned.key`
