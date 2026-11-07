---
layout: page
title: SMB
permalink: /cheatsheets/smb/
---

## Enumeration

### Null session — share listing
```bash
nxc smb <IP> -u '' -p '' --shares
nxc smb <IP> -u 'guest' -p '' --shares
```

### Authenticated — shares + users
```bash
nxc smb <IP> -u <USER> -p '<PASS>' --shares
nxc smb <IP> -u <USER> -p '<PASS>' --users
```

### Kerberos authentication
```bash
nxc smb <DOMAIN> -u <USER> -p '<PASS>' -k --shares
```

### List shares with smbclient
```bash
smbclient -L //<IP> -N
smbclient -L //<IP> -U '<USER>%<PASS>'
```

## File Access

### Connect to share (anonymous)
```bash
smbclient //<IP>/<SHARE> -N
```

### Connect to share (authenticated)
```bash
smbclient //<IP>/<SHARE> -U '<USER>%<PASS>'
```

### Common smbclient commands
```
smb: \> dir
smb: \> get <FILENAME>
smb: \> put <LOCAL_FILE>
smb: \> cd <DIR>
```

### Connect with Kerberos
```bash
smbclient //<FQDN>/<SHARE> --use-kerberos=required
```

## Password Spraying

### Single password against user list
```bash
nxc smb <IP> -u users.txt -p '<PASS>' --continue-on-success
```

### Credential grid spray
```bash
nxc smb <IP> -u users.txt -p pwds.txt --continue-on-success
```

## Other Protocols via nxc

### LDAP validation
```bash
nxc ldap <DOMAIN> -u <USER> -p '<PASS>'
nxc ldap <DOMAIN> -u <USER> -p '<PASS>' --users
```

### WinRM validation
```bash
nxc winrm <IP> -u <USER> -p '<PASS>'
```

### MSSQL credential spray
```bash
nxc mssql <IP> -u users.txt -p pwds.txt --local-auth
```

### FTP credential spray
```bash
nxc ftp <IP> -u users.txt -p pwds.txt --continue-on-success
```
