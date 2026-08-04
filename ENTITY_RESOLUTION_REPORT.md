# Fuzen AI — Automated Entity Resolution Report

## 1. Objectives & Approach
Fuzen AI deploys an automated Entity Resolution Engine that correlates banking and identity attributes to expose synthetic identities, shared device networks, and mule account clusters.

## 2. Correlated Entities
- **Identity Keys**: Customer ID, PAN, GSTIN, Email, Phone, UPI IDs.
- **Physical Nodes**: Device UUIDs, IP Addresses, Browsers, Location coordinates.
- **Role Hierarchies**: Maker IDs, Checker IDs, Company Accounts, Corporate Directors.

## 3. Relationship Graph & Merges
The engine maps multi-hop linkages inside Neo4j. Duplicate nodes are resolved using Jaro-Winkler string similarities and Jaccard hardware parameter weights.

```
 [Maker User A] ──SHARED_DEVICE──> [Device X] <──SHARED_DEVICE── [Checker User B]
        │                                                               │
     CREATES                                                         APPROVES
        ▼                                                               ▼
 [Transaction] ──────────────────CIRCULAR_TRANSFER────────────────> [Company Z]
```
This multi-stage correlation enables the platform to flag collusion and circular loan fraud dynamically.
