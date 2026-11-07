---
layout: page
title: Reconnaissance
permalink: /cheatsheets/recon/
---

## Port Scanning

### Full TCP scan with service detection
```bash
sudo nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/tcp_scan.nmap <IP>
```

### Full TCP + OS detection
```bash
sudo nmap -sC -sV -p- -T4 --min-rate 1000 -O --reason -oN nmap/tcp_scan.nmap <IP>
```

### Two-phase scan (fast discovery → deep scan)
```bash
# Phase 1: fast port discovery
nmap -p- --min-rate 1000 -T4 -oN scans/ports.nmap <IP>

# Phase 2: deep scan on discovered ports
nmap -sC -sV -p <PORTS> -oN scans/deepscan.nmap <IP>
```

## DNS Enumeration

### Query all records
```bash
dig <DOMAIN> @<IP> any
```

### Reverse lookup
```bash
dig -x <IP> @<IP>
```

### Zone transfer attempt
```bash
dig axfr <DOMAIN> @<IP>
```

### DNS enumeration with dnsenum
```bash
dnsenum --dnsserver <IP> <DOMAIN>
```

## Host Setup

### Add single domain
```bash
echo "<IP> <DOMAIN>" | sudo tee -a /etc/hosts
```

### Add domain + hostname
```bash
echo "<IP> <DOMAIN> <HOSTNAME>.<DOMAIN>" | sudo tee -a /etc/hosts
```
