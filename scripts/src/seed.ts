import { db } from "@workspace/db";
import {
  networkAssetsTable,
  networkConnectionsTable,
  agentStatesTable,
  threatIntelTable,
  threatActorsTable,
  iocsTable,
  attackGraphNodesTable,
  attackGraphEdgesTable,
  simulationsTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding SentinelX database...");

  await db.delete(networkConnectionsTable);
  await db.delete(networkAssetsTable);
  await db.delete(agentStatesTable);
  await db.delete(threatIntelTable);
  await db.delete(threatActorsTable);
  await db.delete(iocsTable);
  await db.delete(attackGraphNodesTable);
  await db.delete(attackGraphEdgesTable);
  await db.delete(simulationsTable);

  const assets = await db.insert(networkAssetsTable).values([
    { name: "Internet Gateway", type: "router", zone: "dmz", department: "Infrastructure", ipAddress: "203.0.113.1", os: "Cisco IOS 17.x", services: ["BGP", "OSPF", "NAT"], vulnerabilities: ["CVE-2023-20198"], compromiseLevel: 0, status: "healthy", x: 400, y: 50 },
    { name: "Web Server", type: "server", zone: "dmz", department: "Engineering", ipAddress: "10.0.1.10", os: "Ubuntu 22.04 LTS", services: ["HTTP/443", "HTTP/80", "SSH/22"], vulnerabilities: ["CVE-2023-44487", "CVE-2021-41773"], compromiseLevel: 0, status: "healthy", x: 200, y: 160 },
    { name: "Mail Gateway", type: "server", zone: "dmz", department: "IT Operations", ipAddress: "10.0.1.20", os: "Postfix 3.7", services: ["SMTP/25", "IMAP/993", "POP3/995"], vulnerabilities: ["CVE-2023-2648"], compromiseLevel: 0, status: "healthy", x: 600, y: 160 },
    { name: "Core Switch", type: "switch", zone: "internal", department: "Infrastructure", ipAddress: "10.10.0.1", os: "Cisco NX-OS 10.x", services: ["SNMP", "SSH", "Telnet"], vulnerabilities: ["CVE-2023-20109"], compromiseLevel: 0, status: "healthy", x: 400, y: 290 },
    { name: "Workstation WS-001", type: "workstation", zone: "internal", department: "Finance", ipAddress: "10.10.1.101", os: "Windows 11 22H2", services: ["RDP/3389", "SMB/445", "WinRM/5985"], vulnerabilities: ["CVE-2023-36874", "CVE-2022-24521"], compromiseLevel: 0, status: "healthy", x: 150, y: 400 },
    { name: "Dev Server", type: "server", zone: "internal", department: "Engineering", ipAddress: "10.10.2.50", os: "Ubuntu 20.04 LTS", services: ["SSH/22", "HTTP/8080", "Git/9418"], vulnerabilities: ["CVE-2023-38408"], compromiseLevel: 0, status: "healthy", x: 650, y: 400 },
    { name: "Domain Controller", type: "server", zone: "restricted", department: "IT Operations", ipAddress: "10.20.0.10", os: "Windows Server 2022", services: ["LDAP/389", "Kerberos/88", "DNS/53", "RPC"], vulnerabilities: ["CVE-2022-37967", "CVE-2021-42278"], compromiseLevel: 0, status: "healthy", x: 250, y: 520 },
    { name: "Database Server", type: "database", zone: "restricted", department: "Engineering", ipAddress: "10.20.1.10", os: "RHEL 9.2", services: ["PostgreSQL/5432", "MySQL/3306", "SSH/22"], vulnerabilities: ["CVE-2023-20908", "CVE-2023-21829"], compromiseLevel: 0, status: "healthy", x: 550, y: 520 },
    { name: "Management Console", type: "workstation", zone: "management", department: "IT Operations", ipAddress: "10.30.0.5", os: "macOS 14 Sonoma", services: ["SSH/22", "HTTP/443", "SNMP/161"], vulnerabilities: ["CVE-2023-32434"], compromiseLevel: 0, status: "healthy", x: 400, y: 630 },
  ]).returning();

  await db.insert(networkConnectionsTable).values([
    { sourceId: assets[0].id, targetId: assets[1].id, protocol: "TCP/IP", encrypted: 0 },
    { sourceId: assets[0].id, targetId: assets[2].id, protocol: "TCP/IP", encrypted: 0 },
    { sourceId: assets[1].id, targetId: assets[3].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[2].id, targetId: assets[3].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[3].id, targetId: assets[4].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[3].id, targetId: assets[5].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[3].id, targetId: assets[6].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[6].id, targetId: assets[7].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[6].id, targetId: assets[8].id, protocol: "TCP/IP", encrypted: 1 },
    { sourceId: assets[8].id, targetId: assets[7].id, protocol: "TCP/IP", encrypted: 1 },
  ]);

  await db.insert(agentStatesTable).values([
    { agent: "red_team", state: "idle", currentObjective: "Awaiting simulation start", actionsCompleted: 0, reasoning: "" },
    { agent: "blue_team", state: "idle", currentObjective: "Monitor network for anomalies", actionsCompleted: 0, reasoning: "" },
    { agent: "commander", state: "idle", currentObjective: "Awaiting situation assessment", actionsCompleted: 0, reasoning: "" },
  ]);

  await db.insert(attackGraphNodesTable).values(assets.map((a) => ({
    nodeId: `asset_${a.id}`,
    label: a.name,
    type: a.type,
    status: "intact",
    assetId: a.id,
    riskScore: a.vulnerabilities.length * 20,
  })));

  await db.insert(threatIntelTable).values([
    { cveId: "CVE-2023-44487", title: "HTTP/2 Rapid Reset Attack", severity: "critical", cvssScore: 9.8, description: "A flaw in HTTP/2 protocol allows attackers to send a large number of RST_STREAM frames to flood server resources.", affectedSystems: ["Apache HTTP Server", "nginx", "Microsoft IIS"], mitreId: "T1499.004", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2023-20198", title: "Cisco IOS XE Web UI Privilege Escalation", severity: "critical", cvssScore: 10.0, description: "Unauthenticated RCE vulnerability in Cisco IOS XE Web UI allowing full device takeover.", affectedSystems: ["Cisco IOS XE"], mitreId: "T1190", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2023-36874", title: "Windows Error Reporting Service Privilege Escalation", severity: "high", cvssScore: 7.8, description: "Allows local attacker to gain SYSTEM privileges via WER service.", affectedSystems: ["Windows 10", "Windows 11", "Windows Server"], mitreId: "T1068", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2022-37967", title: "Windows Kerberos PAC Validation Bypass", severity: "high", cvssScore: 7.2, description: "Allows attackers with control of a service account to gain privileges via Kerberos PAC validation bypass.", affectedSystems: ["Windows Server 2022", "Windows Server 2019"], mitreId: "T1558.003", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2023-38408", title: "OpenSSH ssh-agent Remote Code Execution", severity: "critical", cvssScore: 9.8, description: "Remote code execution vulnerability in ssh-agent via malicious PKCS#11 library loading.", affectedSystems: ["OpenSSH < 9.3p2"], mitreId: "T1021.004", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2021-41773", title: "Apache HTTP Server Path Traversal", severity: "critical", cvssScore: 9.8, description: "Path traversal flaw allows unauthenticated attacker to read/execute files outside document root.", affectedSystems: ["Apache HTTP Server 2.4.49"], mitreId: "T1083", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2021-42278", title: "Active Directory Domain Privilege Escalation (noPac)", severity: "high", cvssScore: 7.5, description: "Machine account spoofing vulnerability allowing privilege escalation to domain admin.", affectedSystems: ["Windows Server 2022", "Windows Server 2019", "Windows Server 2016"], mitreId: "T1134.005", exploitability: "functional", patchAvailable: true },
    { cveId: "CVE-2023-32434", title: "Apple macOS Integer Overflow in Kernel", severity: "high", cvssScore: 7.8, description: "Integer overflow in kernel may lead to arbitrary code execution with kernel privileges.", affectedSystems: ["macOS Ventura < 13.3", "macOS Sonoma < 14.1"], mitreId: "T1068", exploitability: "unproven", patchAvailable: true },
  ]);

  await db.insert(threatActorsTable).values([
    { name: "APT29 (Cozy Bear)", aliases: ["The Dukes", "Cozy Bear", "Nobelium"], motivation: "Espionage", sophistication: "nation_state", targetedSectors: ["Government", "Defense", "Healthcare", "Energy"], tactics: ["T1566.001", "T1078", "T1021.001", "T1057", "T1083"], description: "Russian SVR-linked APT known for SolarWinds supply chain attack and sophisticated long-term espionage campaigns.", activeStatus: true },
    { name: "Lazarus Group", aliases: ["Hidden Cobra", "ZINC", "APT38"], motivation: "Financial", sophistication: "nation_state", targetedSectors: ["Financial", "Defense", "Technology"], tactics: ["T1566", "T1190", "T1486", "T1041"], description: "North Korean state-sponsored group responsible for Sony Pictures hack, WannaCry, and billions stolen from banks.", activeStatus: true },
    { name: "FIN7", aliases: ["Carbon Spider", "Sangria Tempest"], motivation: "Financial", sophistication: "criminal", targetedSectors: ["Retail", "Hospitality", "Finance"], tactics: ["T1566.001", "T1059.001", "T1055", "T1078", "T1041"], description: "Prolific financially-motivated threat actor targeting point-of-sale systems and conducting ransomware operations.", activeStatus: true },
    { name: "ALPHV/BlackCat", aliases: ["BlackCat", "ALPHV", "Noberus"], motivation: "Financial", sophistication: "criminal", targetedSectors: ["Healthcare", "Critical Infrastructure", "Manufacturing"], tactics: ["T1486", "T1490", "T1562", "T1078"], description: "Sophisticated ransomware-as-a-service operation using advanced Rust-based malware for double extortion attacks.", activeStatus: true },
  ]);

  await db.insert(iocsTable).values([
    { type: "ip", value: "185.234.219.147", severity: "critical", confidence: 0.97, description: "Known C2 server associated with APT29 infrastructure", associatedActor: "APT29 (Cozy Bear)", firstSeen: new Date("2024-01-15"), lastSeen: new Date() },
    { type: "domain", value: "update-cdn.office365-service.com", severity: "high", confidence: 0.92, description: "Typosquatted Microsoft domain used in phishing campaigns", associatedActor: "APT29 (Cozy Bear)", firstSeen: new Date("2024-02-01"), lastSeen: new Date() },
    { type: "hash", value: "44d88612fea8a8f36de82e1278abb02f", severity: "critical", confidence: 0.99, description: "EICAR test file variant — Lazarus Group dropper", associatedActor: "Lazarus Group", firstSeen: new Date("2024-01-20"), lastSeen: new Date() },
    { type: "email", value: "hr-notifications@corp-updates.io", severity: "high", confidence: 0.88, description: "Phishing sender impersonating HR department", associatedActor: "FIN7", firstSeen: new Date("2024-03-10"), lastSeen: new Date() },
    { type: "url", value: "https://cdn.staticfiles-delivery.com/update.ps1", severity: "critical", confidence: 0.95, description: "Malicious PowerShell dropper URL distributing ransomware payload", associatedActor: "ALPHV/BlackCat", firstSeen: new Date("2024-03-01"), lastSeen: new Date() },
    { type: "ip", value: "91.92.255.83", severity: "high", confidence: 0.85, description: "Tor exit node used for anonymized attack traffic routing", associatedActor: null, firstSeen: new Date("2024-02-15"), lastSeen: new Date() },
    { type: "hash", value: "5b4b3985339eda35e46d2be3aa67ff27", severity: "high", confidence: 0.91, description: "BlackCat ransomware payload binary hash", associatedActor: "ALPHV/BlackCat", firstSeen: new Date("2024-01-05"), lastSeen: new Date() },
  ]);

  const [sim] = await db.insert(simulationsTable).values({ state: "idle", phase: "reconnaissance", scenario: "apt_attack", difficulty: "medium" }).returning();

  console.log(`Seeded: ${assets.length} assets, 10 connections, 3 agent states, 8 CVEs, 4 threat actors, 7 IOCs`);
  console.log(`Initial simulation ID: ${sim.id}`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
