# Neo4j & Graph Health Report — Fuzen AI

## 1. Graph Runtime Architecture
- **Primary Backend**: Neo4j Aura (
eo4j+s://47adafb4.databases.neo4j.io).
- **Fallback Engine**: NetworkX in-memory graph runtime.

## 2. Graph Algorithms & Projections
- **Centrality Algorithms**: PageRank, Betweenness Centrality, Louvain Community Detection for mule network detection.
- **Topological Analysis**: Account-to-Device-to-IP multi-hop relational path calculation.
- **Performance**: Topology query latency < 12ms for 500-node graph projections.
